
import Message from "./Message";

interface ConversationListProps {
    className?: string;
    header?: string | JSX.Element | null;
    messages: Message[];
    username: string;
}
export default ConversationListProps;