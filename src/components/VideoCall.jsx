import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

// Default STUN-only config (fallback when Metered fetch fails)
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

    // --- TURN Server State ---
    // Using ref so setupPeerConnection always reads the latest value (avoids stale closure bug)
    const rtcConfigRef = useRef(DEFAULT_RTC_CONFIG);
    const [isRtcReady, setIsRtcReady] = useState(false);
    const [turnEnabled, setTurnEnabled] = useState(false); // Track if TURN was fetched successfully

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
    const iceRestartTimeoutRef = useRef(null);

    // Dragging Logic
    const handleDragStart = (e) => {
        setIsDragging(true);
        dragStart.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
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
            window.getSelection()?.removeAllRanges();
            if (isDragging) {
                setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
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

    // ─── CRITICAL: Fetch TURN Server Credentials from Metered ───────────────
    // Using iceTransportPolicy: 'relay' forces ALL media through TURN relay.
    // This guarantees connectivity across ANY network (corporate, mobile, etc.)
    // at the cost of routing the stream through a relay server.
    useEffect(() => {
        const fetchIceServers = async () => {
            try {
                const domain = import.meta.env.VITE_METERED_DOMAIN;
                const apiKey = import.meta.env.VITE_METERED_SECRET_KEY;

                if (!domain || !apiKey) {
                    console.warn('[WebRTC] Metered credentials missing. Operating in STUN-only mode (cross-network may fail).');
                    setIsRtcReady(true);
                    return;
                }

                console.log('[WebRTC] Fetching TURN credentials from Metered...');
                const response = await fetch(
                    `https://${domain}/api/v1/turn/credentials?apiKey=${apiKey}`,
                    { signal: AbortSignal.timeout(8000) } // 8s timeout
                );

                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const iceServers = await response.json();

                if (!Array.isArray(iceServers) || iceServers.length === 0) {
                    throw new Error('Empty ICE server list returned');
                }

                const turnServers = iceServers.filter(s =>
                    (Array.isArray(s.urls) ? s.urls : [s.urls]).some(u => u.startsWith('turn:') || u.startsWith('turns:'))
                );

                if (turnServers.length === 0) {
                    throw new Error('No TURN servers in response');
                }

                // RELAY policy: forces ALL ICE candidates to be relayed through TURN.
                // This eliminates any chance of a direct-connection attempt failing
                // and guarantees connectivity across all network types.
                rtcConfigRef.current = {
                    iceServers,
                    iceTransportPolicy: 'relay',
                    iceCandidatePoolSize: 10,
                    bundlePolicy: 'max-bundle',
                    rtcpMuxPolicy: 'require',
                };

                setTurnEnabled(true);
                console.log(`[WebRTC] ✅ TURN enabled: ${turnServers.length} relay servers. Policy: relay-only.`);
                console.log('[WebRTC] ICE Servers:', iceServers.map(s => s.urls));
                setIsRtcReady(true);
            } catch (error) {
                console.error('[WebRTC] ❌ Failed to fetch TURN servers:', error.message);
                console.warn('[WebRTC] Falling back to STUN-only (cross-network calls may NOT work).');
                // Keep DEFAULT_RTC_CONFIG (STUN-only) as the fallback
                setIsRtcReady(true);
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
        };
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
            console.error('[WebRTC] Camera/mic access error:', err);
            setMediaError('Không thể truy cập Camera/Micro. Vui lòng kiểm tra quyền thiết bị.');
            return null;
        }
    }, []);

    // 2. Setup Peer Connection
    const setupPeerConnection = useCallback((stream) => {
        // Always read from ref to get the latest TURN config (avoids stale closure bug)
        const config = rtcConfigRef.current;
        const pc = new RTCPeerConnection(config);
        peerConnectionRef.current = pc;

        const policy = config.iceTransportPolicy || 'all';
        console.log(`[WebRTC] ✅ PeerConnection created. Policy: ${policy}. Servers: ${config.iceServers?.length}`);

        // Add local tracks to PC
        if (stream) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        }

        // Handle remote tracks
        pc.ontrack = (event) => {
            console.log('[WebRTC] Remote track received:', event.track.kind);
            setRemoteStream(event.streams[0]);
        };

        // Handle ICE candidates - send immediately to the other peer
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                emit('webrtc:signal', {
                    targetId: otherUser._id,
                    signal: { type: 'candidate', candidate: event.candidate }
                });
            }
        };

        // Track connection state with auto-restart on failure
        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            console.log(`[WebRTC] Connection State → ${state}`);

            if (state === 'connected') {
                setCallStatus('active');
                if (iceRestartTimeoutRef.current) clearTimeout(iceRestartTimeoutRef.current);
            }

            if (state === 'failed') {
                setCallStatus('failed');
                console.warn('[WebRTC] Connection failed. Attempting ICE restart...');
                // Auto-restart ICE if we are the caller
                if (mode === 'outbound' && pc.restartIce) {
                    iceRestartTimeoutRef.current = setTimeout(async () => {
                        try {
                            pc.restartIce();
                            const offer = await pc.createOffer({ iceRestart: true });
                            await pc.setLocalDescription(offer);
                            emit('webrtc:signal', { targetId: otherUser._id, signal: offer });
                            console.log('[WebRTC] ICE Restart offer sent.');
                        } catch (e) {
                            console.error('[WebRTC] ICE Restart failed:', e);
                        }
                    }, 1500);
                }
            }

            if (state === 'disconnected') {
                setCallStatus('connecting');
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`[WebRTC] ICE Connection → ${pc.iceConnectionState}`);
        };

        pc.onicegatheringstatechange = () => {
            console.log(`[WebRTC] ICE Gathering → ${pc.iceGatheringState}`);
        };

        return pc;
    }, [otherUser._id, emit, mode]);

    // Handle Outbound Call
    const startCall = useCallback(async () => {
        const stream = await initLocalStream();
        if (!stream) {
            setCallStatus('error');
            return;
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
            return;
        }

        const pc = setupPeerConnection(stream);

        if (incomingSignal?.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal));

            // Drain any ICE candidates that arrived before we set the remote description
            while (signalingQueueRef.current.length > 0) {
                const candidate = signalingQueueRef.current.shift();
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) { console.error('[WebRTC] Error adding queued ICE candidate:', e); }
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            emit('webrtc:signal', { targetId: otherUser._id, signal: answer });
        }

        emit('call:respond', { callerId: otherUser._id, accepted: true });
    }, [initLocalStream, setupPeerConnection, otherUser._id, emit, incomingSignal]);

    const declineCall = useCallback(() => {
        emit('call:respond', { callerId: otherUser._id, accepted: false });
        handleEndCall();
    }, [otherUser._id, emit]);

    const handleEndCall = useCallback(() => {
        if (iceRestartTimeoutRef.current) clearTimeout(iceRestartTimeoutRef.current);
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

                    // Drain queued ICE candidates after setting remote desc
                    while (signalingQueueRef.current.length > 0) {
                        const candidate = signalingQueueRef.current.shift();
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(candidate));
                        } catch (e) { console.error('[WebRTC] Error draining ICE queue:', e); }
                    }
                } else if (signal.type === 'answer') {
                    if (!pc) return;
                    await pc.setRemoteDescription(new RTCSessionDescription(signal));
                    // Drain queued candidates after answer is set
                    while (signalingQueueRef.current.length > 0) {
                        const candidate = signalingQueueRef.current.shift();
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(candidate));
                        } catch (e) { console.error('[WebRTC] Error draining ICE queue (answer):', e); }
                    }
                } else if (signal.type === 'candidate') {
                    if (!pc || !pc.remoteDescription) {
                        // Queue candidate if remote description isn't set yet
                        signalingQueueRef.current.push(signal.candidate);
                    } else {
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                        } catch (e) { console.error('[WebRTC] Error adding ICE candidate:', e); }
                    }
                }
            } catch (e) { console.error('[WebRTC] Signaling error:', e); }
        };

        const onAnswered = ({ accepted }) => {
            if (!accepted) {
                alert('Người dùng đã từ chối cuộc gọi');
                handleEndCall();
            } else {
                setCallStatus('connecting');
            }
        };

        const onEndedByRemote = () => {
            handleEndCall();
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
        socket.on('call:ended', onEndedByRemote);
        socket.on('call:busy', onBusy);
        socket.on('call:error', onError);

        return () => {
            socket.off('webrtc:signal', onSignal);
            socket.off('call:answered', onAnswered);
            socket.off('call:ended', onEndedByRemote);
            socket.off('call:busy', onBusy);
            socket.off('call:error', onError);
        };
    }, [socket, otherUser._id, emit, handleEndCall]);

    // Initial Action — wait until TURN is ready before initiating
    useEffect(() => {
        if (isRtcReady && mode === 'outbound') {
            startCall();
        }
    }, [mode, startCall, isRtcReady]);

    const toggleMute = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const containerRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Fullscreen error: ${err.message}`);
            });
            setIsFullscreen(true);
            setIsMinimized(false);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const handleToggleMinimize = () => {
        if (!isMinimized && isFullscreen) {
            if (document.fullscreenElement) document.exitFullscreen();
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
        if (!video || !remoteStream) {
            alert('Chưa có kết nối hình ảnh. Tính năng PiP cần có luồng video đang chạy.');
            return;
        }
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await video.requestPictureInPicture();
            }
        } catch (error) {
            console.error('PiP error:', error);
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
                {/* Background Blur Overlay */}
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
                                            callStatus === 'connecting' ? 'Đang kết nối...' :
                                                callStatus === 'failed' ? 'Kết nối lỗi' :
                                                    callStatus === 'active' ? (turnEnabled ? '🔒 Bảo mật (TURN)' : 'Trực tuyến') : 'Trực tuyến'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={handleToggleMinimize}
                            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer relative z-20"
                            title={isMinimized ? 'Phóng to' : 'Thu nhỏ'}
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

                {/* Main Content Area - CSS hidden instead of unmount to preserve video streams */}
                <div className={`flex-1 flex flex-col relative overflow-hidden ${isMinimized ? 'hidden' : 'flex'}`}>
                    <div className="flex-1 flex flex-col relative overflow-hidden">
                        {/* Video Area */}
                        <div className="flex-1 relative bg-gray-950 flex items-center justify-center overflow-hidden">
                            {mediaError && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-6 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <span className="material-icons text-3xl text-red-500">videocam_off</span>
                                        <p className="text-white text-xs font-medium leading-relaxed">{mediaError}</p>
                                        <button onClick={handleEndCall} className="mt-2 px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold transition-all">
                                            Đóng
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Remote Video (Full Size) */}
                            {remoteStream ? (
                                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20">
                                        <img src={otherUser.avatar || '/default-avatar.png'} alt={otherUser.name} className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-white/60 text-xs font-medium">{otherUser.name}</p>
                                    {(callStatus === 'calling' || callStatus === 'connecting') && (
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Local Video (Floating) */}
                            {localStream && (
                                <div className={`absolute bottom-4 right-4 w-28 h-20 bg-gray-800 rounded-xl overflow-hidden border border-white/20 shadow-xl z-20 transition-opacity ${isVideoOff ? 'opacity-50' : 'opacity-100'}`}>
                                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
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
                                        className={`w-11 h-11 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 active:scale-95 animate-bounce ${!isRtcReady ? 'opacity-50 cursor-not-allowed animate-pulse' : ''}`}
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
                </div>

                <style jsx>{`
                .mirror { transform: scaleX(-1); }
                .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
            `}</style>
            </div>
        </>
    );
}
