import { useSocket } from '../context/SocketContext';
import VideoCall from './VideoCall';

export default function GlobalCallHandler() {
    const { callData, setCallData } = useSocket();

    if (!callData.show) return null;

    return (
        <VideoCall
            mode={callData.mode}
            otherUser={callData.target}
            incomingSignal={callData.signal}
            onClose={() => setCallData({ show: false, mode: 'outbound', target: null, signal: null })}
        />
    );
}
