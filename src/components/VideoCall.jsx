import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

// Initial stun configuration
const DEFAULT_RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

// Simple Ringtone Generator using Web Audio API
const playRingtone = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 1);
    return ctx;
};

export default function VideoCall({
    mode, // 'outbound' | 'inbound' 
    otherUser,
    onClose,
    incomingSignal = null
}) {
    const { socket, emit } = useSocket();
    const { user } = useAuth();

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callStatus, setCallStatus] = useState(mode === 'inbound' ? 'ringing' : 'calling');
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [mediaError, setMediaError] = useState(null);
    const rtcConfigRef = useRef(DEFAULT_RTC_CONFIG); // Use ref so setupPeerConnection always reads latest value
    const [isRtcReady, setIsRtcReady] = useState(false);

    // Draggable & Resizable State
    const [position, setPosition] = useState({ x: window.innerWidth - 380, y: window.innerHeight - 520 });
    const [size, setSize] = useState({ width: 340, height: 480 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const resizeStart = useRef({ w: 0, h: 0, x: 0, y: 0 });

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const signalingQueueRef = useRef([]);
    const ringtoneIntervalRef = useRef(null);

    // Dragging Logic
    const handleDragStart = (e) => {
        setIsDragging(true);
        dragStart.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
        // Prevent text selection
        document.body.style.userSelect = 'none';
    };

    // Resizing Logic
    const handleResizeStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        resizeStart.current = {
            w: size.width,
            h: size.height,
            x: e.clientX,
            y: e.clientY
        };
        document.body.style.userSelect = 'none';
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            // Clear any accidental selection
            window.getSelection()?.removeAllRanges();

            if (isDragging) {
                setPosition({
                    x: e.clientX - dragStart.current.x,
                    y: e.clientY - dragStart.current.y
                });
            }
            if (isResizing) {
                const deltaX = e.clientX - resizeStart.current.x;
                const deltaY = e.clientY - resizeStart.current.y;
                setSize({
                    width: Math.max(280, resizeStart.current.w + deltaX),
                    height: Math.max(200, resizeStart.current.h + deltaY)
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };

        if (isDragging || isResizing) {
            document.body.style.cursor = isDragging ? 'grabbing' : 'nwse-resize';
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, position, size]);

    // Fetch TURN server credentials from Metered
    useEffect(() => {
        const fetchIceServers = async () => {
            try {
                const domain = import.meta.env.VITE_METERED_DOMAIN;
                const apiKey = import.meta.env.VITE_METERED_SECRET_KEY;

                if (!domain || !apiKey) {
                    console.warn('[WebRTC] Metered credentials missing, using default STUN only');
                    setIsRtcReady(true);
                    return;
                }

                const response = await fetch(`https://${domain}/api/v1/turn/credentials?apiKey=${apiKey}`);
                const iceServers = await response.json();

                if (!Array.isArray(iceServers) || iceServers.length === 0) {
                    console.warn('[WebRTC] TURN fetch returned empty, using default STUN only');
                    setIsRtcReady(true);
                    return;
                }

                console.log(`[WebRTC] Fetched ${iceServers.length} ICE servers (STUN+TURN):`, iceServers.map(s => s.urls));
                rtcConfigRef.current = { iceServers };
                setIsRtcReady(true);
            } catch (error) {
                console.error('[WebRTC] Error fetching TURN servers, falling back to STUN:', error);
                setIsRtcReady(true); // Fallback to STUN
            }
        };

        fetchIceServers();
    }, []);

    // Play ringtone while ringing
    useEffect(() => {
        if (callStatus === 'ringing') {
            ringtoneIntervalRef.current = setInterval(playRingtone, 2000);
            playRingtone();
        } else {
            if (ringtoneIntervalRef.current) clearInterval(ringtoneIntervalRef.current);
        }
        return () => {
            if (ringtoneIntervalRef.current) clearInterval(ringtoneIntervalRef.current);
        }
    }, [callStatus]);

    // Bind streams to video elements safely after they render
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // 1. Initialize Local Stream
    const initLocalStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            return stream;
        } catch (err) {
            console.error('Lỗi truy cập camera/mic:', err);
            setMediaError('Không thể truy cập Camera/Micro. Vui lòng kiểm tra quyền thiết bị.');
            return null;
        }
    }, []);

    // 2. Setup Peer Connection
    const setupPeerConnection = useCallback((stream) => {
        // Always read from ref to get the latest TURN config (avoids stale closure bug)
        const pc = new RTCPeerConnection(rtcConfigRef.current);
        console.log('[WebRTC] Creating PeerConnection with ICE servers:', rtcConfigRef.current.iceServers?.map(s => s.urls));
        peerConnectionRef.current = pc;

        // Add local tracks to PC
        if (stream) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        }

        // Handle remote tracks
        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                emit('webrtc:signal', { targetId: otherUser._id, signal: { type: 'candidate', candidate: event.candidate } });
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') setCallStatus('active');
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                // Don't auto-close if it's just a failure, let user see status
                setCallStatus('failed');
            }
        };

        return pc;
    }, [otherUser._id, emit]); // rtcConfigRef intentionally omitted — refs don't cause re-renders

    // Handle Outbound Call
    const startCall = useCallback(async () => {
        const stream = await initLocalStream();

        // Even without stream, we can initiate signaling (though video won't work)
        // But let's show error to user
        if (!stream) {
            setCallStatus('error');
        }

        const pc = setupPeerConnection(stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        emit('call:initiate', {
            receiverId: otherUser._id,
            callerName: user.name,
            callerAvatar: user.avatar,
            signal: offer
        });
    }, [initLocalStream, setupPeerConnection, otherUser, user, emit]);

    // Handle Inbound Call Acceptance
    const acceptCall = useCallback(async () => {
        setCallStatus('connecting');
        const stream = await initLocalStream();

        if (!stream) {
            setCallStatus('error');
        }

        const pc = setupPeerConnection(stream);

        // Process initial signal if exists
        if (incomingSignal) {
            if (incomingSignal.type === 'offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal));

                // Drain ICE queue from early caller candidates
                while (signalingQueueRef.current.length > 0) {
                    const candidate = signalingQueueRef.current.shift();
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (e) { console.error('Error adding queued ICE candidate', e); }
                }

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                emit('webrtc:signal', { targetId: otherUser._id, signal: answer });
            }
        }

        emit('call:respond', { callerId: otherUser._id, accepted: true });
    }, [initLocalStream, setupPeerConnection, otherUser._id, emit, incomingSignal]);

    const declineCall = useCallback(() => {
        emit('call:respond', { callerId: otherUser._id, accepted: false });
        handleEndCall();
    }, [otherUser._id, emit, onClose]);

    const handleEndCall = useCallback(() => {
        if (localStream) localStream.getTracks().forEach(t => t.stop());
        if (peerConnectionRef.current) peerConnectionRef.current.close();
        emit('call:end', { targetId: otherUser._id });
        onClose();
    }, [localStream, otherUser._id, emit, onClose]);

    // Signaling Listener
    useEffect(() => {
        if (!socket) return;

        const onSignal = async ({ signal }) => {
            const pc = peerConnectionRef.current;

            try {
                if (signal.type === 'offer') {
                    if (!pc) return;
                    await pc.setRemoteDescription(new RTCSessionDescription(signal));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    emit('webrtc:signal', { targetId: otherUser._id, signal: answer });
                } else if (signal.type === 'answer') {
                    if (!pc) return;
                    await pc.setRemoteDescription(new RTCSessionDescription(signal));

                    // Drain ICE queue when Answer is received (Caller side)
                    while (signalingQueueRef.current.length > 0) {
                        const candidate = signalingQueueRef.current.shift();
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(candidate));
                        } catch (e) { console.error('Error adding queued candidate:', e); }
                    }
                } else if (signal.type === 'candidate') {
                    if (!pc || !pc.remoteDescription) {
                        // Queue candidate if PC is not ready or RemoteDescription not set
                        signalingQueueRef.current.push(signal.candidate);
                    } else {
                        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                    }
                }
            } catch (e) { console.error('Signaling error:', e); }
        };

        const onAnswered = ({ accepted }) => {
            if (!accepted) {
                // 'accepted' is false can mean declined by user
                alert('Người dùng đã từ chối cuộc gọi');
                handleEndCall();
            } else {
                setCallStatus('connecting');
            }
        };

        const onBusy = () => {
            alert('Người dùng đang trong một cuộc gọi khác.');
            handleEndCall();
        };

        const onError = ({ message }) => {
            alert(message || 'Có lỗi xảy ra khi thực hiện cuộc gọi.');
            handleEndCall();
        };

        socket.on('webrtc:signal', onSignal);
        socket.on('call:answered', onAnswered);
        socket.on('call:busy', onBusy);
        socket.on('call:error', onError);

        return () => {
            socket.off('webrtc:signal', onSignal);
            socket.off('call:answered', onAnswered);
            socket.off('call:busy', onBusy);
            socket.off('call:error', onError);
        };
    }, [socket, otherUser._id, emit, handleEndCall]);

    // Initial Action
    useEffect(() => {
        if (isRtcReady && mode === 'outbound') {
            startCall();
        }
    }, [mode, startCall, isRtcReady]);

    const toggleMute = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!audioTrack.enabled);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoOff(!videoTrack.enabled);
        }
    };

    const containerRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
            setIsFullscreen(true);
            setIsMinimized(false); // Can't be fullscreen and minimized
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const handleToggleMinimize = () => {
        if (!isMinimized && isFullscreen) {
            // If we are fullscreen and want to minimize, exit fullscreen first
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
            setIsFullscreen(false);
        }
        setIsMinimized(!isMinimized);
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const [isPiP, setIsPiP] = useState(false);

    const togglePiP = async () => {
        if (!document.pictureInPictureEnabled) {
            alert('Trình duyệt của bạn không hỗ trợ chế độ Picture-in-Picture');
            return;
        }

        const video = remoteVideoRef.current;

        // Prevent PiP if there is no active video stream (e.g., HTTP restriction)
        if (!video || !remoteStream) {
            alert('Chưa có kết nối hình ảnh. Tính năng PiP cần có luồng video đang chạy (Yêu cầu HTTPS hoặc đang trong cuộc gọi).');
            return;
        }

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await video.requestPictureInPicture();
            }
        } catch (error) {
            console.error('Lỗi PiP:', error);
            alert('Không thể bật PiP: ' + error.message);
        }
    };

    useEffect(() => {
        const video = remoteVideoRef.current;
        if (!video) return;
        const onEnter = () => setIsPiP(true);
        const onLeave = () => setIsPiP(false);
        video.addEventListener('enterpictureinpicture', onEnter);
        video.addEventListener('leavepictureinpicture', onLeave);
        return () => {
            video.removeEventListener('enterpictureinpicture', onEnter);
            video.removeEventListener('leavepictureinpicture', onLeave);
        };
    }, [remoteStream]);

    // Draggable & Resizable Floating Window
    return (
        <>
            {/* Global Drag/Resize Overlay */}
            {(isDragging || isResizing) && (
                <div
                    className="fixed inset-0 z-[999999] pointer-events-auto cursor-grabbing select-none"
                    style={{ cursor: isDragging ? 'grabbing' : 'nwse-resize' }}
                />
            )}

            <div
                ref={containerRef}
                className={`fixed z-[1000] flex flex-col bg-gray-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300 ease-out group ${isMinimized ? 'hover:scale-105' : ''} ${isFullscreen ? '!fixed !inset-0 !w-full !h-full !rounded-none !z-[1000000]' : ''}`}
                style={isFullscreen ? {} : {
                    left: position.x,
                    top: position.y,
                    width: isMinimized ? 256 : size.width,
                    height: isMinimized ? 64 : size.height,
                }}
            >
                {/* Background Blur Overlay for Glassmorphism */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl pointer-events-none" />

                {/* Header / Drag Bar */}
                <div
                    onMouseDown={handleDragStart}
                    className="relative z-10 p-4 flex items-center gap-3 border-b border-white/5 cursor-move active:cursor-grabbing hover:bg-white/5 transition-colors shrink-0"
                >
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                        <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden shrink-0">
                            <img src={otherUser.avatar || '/default-avatar.png'} alt={otherUser.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="overflow-hidden">
                            <h3 className="text-white font-bold text-xs truncate">{otherUser.name}</h3>
                            <p className="text-primary/80 text-[10px] font-bold uppercase tracking-wider truncate">
                                {mediaError ? 'Lỗi thiết bị' :
                                    callStatus === 'ringing' ? 'Cuộc gọi đến...' :
                                        callStatus === 'calling' ? 'Đang gọi...' :
                                            callStatus === 'connecting' ? 'Đăng kết nối...' :
                                                callStatus === 'failed' ? 'Kết nối lỗi' : 'Trực tuyến'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={handleToggleMinimize}
                            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer relative z-20"
                            title={isMinimized ? "Phóng to" : "Thu nhỏ"}
                        >
                            <span className="material-symbols-outlined text-[18px]">{isMinimized ? 'open_in_full' : 'close_fullscreen'}</span>
                        </button>
                        {!isMinimized && (
                            <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={handleEndCall}
                                className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer relative z-20"
                            >
                                <span className="material-icons text-[18px]">close</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                {!isMinimized && (
                    <div className="flex-1 flex flex-col relative overflow-hidden">
                        {/* Video Area */}
                        <div className="flex-1 relative bg-gray-950 flex items-center justify-center overflow-hidden">
                            {mediaError && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-6 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <span className="material-icons text-3xl text-red-500">videocam_off</span>
                                        <p className="text-white text-xs font-medium leading-relaxed">{mediaError}</p>
                                        <button
                                            onClick={handleEndCall}
                                            className="mt-2 px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold transition-all"
                                        >
                                            Đóng
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Remote Video (Full Size) */}
                            {remoteStream ? (
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center animate-pulse">
                                        <span className="material-icons text-2xl text-gray-600">person</span>
                                    </div>
                                    {callStatus === 'ringing' && (
                                        <div className="flex gap-1">
                                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Local Video (Floating) */}
                            {localStream && (
                                <div className={`absolute bottom-4 right-4 w-28 h-20 bg-gray-800 rounded-xl overflow-hidden border border-white/20 shadow-xl z-20 transition-opacity ${isVideoOff ? 'opacity-50' : 'opacity-100'}`}>
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover mirror"
                                    />
                                    {isVideoOff && <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80"><span className="material-icons text-white/30 text-sm">videocam_off</span></div>}
                                </div>
                            )}
                        </div>

                        {/* Controls Toolbar */}
                        <div className="h-20 bg-gray-900/80 backdrop-blur-md flex items-center justify-center gap-4 px-4 border-t border-white/5 shrink-0">
                            {callStatus === 'ringing' ? (
                                <>
                                    <button
                                        onClick={declineCall}
                                        className="w-11 h-11 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
                                    >
                                        <span className="material-icons text-lg">call_end</span>
                                    </button>
                                    <button
                                        onClick={acceptCall}
                                        disabled={!isRtcReady}
                                        className={`w-11 h-11 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 active:scale-95 animate-bounce ${!isRtcReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className="material-icons text-lg">call</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={toggleMute}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                    >
                                        <span className="material-icons text-lg">{isMuted ? 'mic_off' : 'mic'}</span>
                                    </button>

                                    <button
                                        onClick={handleEndCall}
                                        className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
                                    >
                                        <span className="material-icons text-xl">call_end</span>
                                    </button>

                                    <button
                                        onClick={toggleVideo}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                    >
                                        <span className="material-icons text-lg">{isVideoOff ? 'videocam_off' : 'videocam'}</span>
                                    </button>

                                    <button
                                        onClick={toggleFullscreen}
                                        className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center shadow-lg transition-all"
                                        title="Toàn màn hình"
                                    >
                                        <span className="material-icons text-lg">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
                                    </button>

                                    <button
                                        onClick={togglePiP}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${isPiP ? 'bg-primary text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                        title="Chế độ nổi (PiP)"
                                    >
                                        <span className="material-icons text-lg">picture_in_picture_alt</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Resize Handle */}
                        <div
                            onMouseDown={handleResizeStart}
                            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-[60] flex items-end justify-end p-0.5 group/resizer"
                        >
                            <div className="w-2 h-2 border-r-2 border-b-2 border-white/20 rounded-br-sm group-hover/resizer:border-primary transition-colors" />
                        </div>
                    </div>
                )}

                <style jsx>{`
                .mirror { transform: scaleX(-1); }
                .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
            `}</style>
            </div>
        </>
    );
}
