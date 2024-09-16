export const addMessage=(sender, message, date, setMessages)=>
{
    var msg=
    {
        date:date,
        content: message,
        username: sender,
        id: Date.now()
    }
    //console.log("Message: ", msg);
    setMessages(current => [ ...current, msg]);
}