const socket = io();

//elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageButton = $messageForm.querySelector('button');

const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () =>{
    // new msg element
    const $newMessage = $messages.lastElementChild

    // height of the last message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //height of messages container
    const containerHeight = $messages.scrollHeight

    //how far have i scrolled???
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }

}

socket.on('message',(msg)=>{
    console.log(msg);
    const html = Mustache.render(messageTemplate,{
        username: msg.username,
        msg: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a') 
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll()
})

socket.on('locationMessage',(msg)=>{
    console.log(msg);
    const html = Mustache.render(locationMessageTemplate,{
        username: msg.username,
        url: msg.url,
        createdAt: moment(msg.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll()
})

socket.on('roomData',({room, users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault();

    $messageButton.setAttribute('disabled','disabled')
    //disable sending
    const message = e.target.elements.message.value

    socket.emit('sendMessage',message,(err)=>{
        //enable sending
        $messageButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if(err){
            return console.log(err);
        }
        console.log('ok');
    });
})

$sendLocationButton.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('geolocation is not supported by your browser');
    }

    $sendLocationButton.setAttribute('disabled','disabled');
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation',{
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, ()=>{
            $sendLocationButton.removeAttribute('disabled');
            console.log('location shared!');
        });
    });
})

socket.emit('join', {username, room},(error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})