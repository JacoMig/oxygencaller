var WebRTC = require('./webrtc');
var WildEmitter = require('wildemitter');
var webrtcSupport = require('webrtcsupport');
var attachMediaStream = require('attachmediastream');
var mockconsole = require('mockconsole');
var SocketIoConnection = require('./socketioconnection');

function SimpleWebRTC(opts) {
    var self = this;
    var options = opts || {};
    var config = this.config = {
                    target: '',
            url: 'https://sandbox.simplewebrtc.com:443/',
            socketio: {/* 'force new connection':true*/},
            connection: null,
            debug: false,
            localVideoEl: '',
            remoteVideosEl: '',
            enableDataChannels: true,
            autoRequestMedia: false,
            autoRemoveVideos: true,
            adjustPeerVolume: false,
            peerVolumeWhenSpeaking: 0.25,
            media: {
                video: true,
                audio: true
            },
            receiveMedia: {
                offerToReceiveAudio: 1,
                offerToReceiveVideo: 1
            },
            localVideo: {
                autoplay: true,
                mirror: true,
                muted: true
            }
        };
    var item, connection;

    // We also allow a 'logger' option. It can be any object that implements
    // log, warn, and error methods.
    // We log nothing by default, following "the rule of silence":
    // http://www.linfo.org/rule_of_silence.html
    this.logger = function () {
        // we assume that if you're in debug mode and you didn't
        // pass in a logger, you actually want to log as much as
        // possible.
        if (opts.debug) {
            return opts.logger || console;
        } else {
        // or we'll use your logger which should have its own logic
        // for output. Or we'll return the no-op.
            return opts.logger || mockconsole;
        }
    }();

    // set our config from options
    for (item in options) {
        if (options.hasOwnProperty(item)) {
            this.config[item] = options[item];
        }
    }

    // attach detected support for convenience
    this.capabilities = webrtcSupport;

    // call WildEmitter constructor
    WildEmitter.call(this);

    // create default SocketIoConnection if it's not passed in
    if (this.config.connection === null) {
        connection = this.connection = new SocketIoConnection(this.config);
    } else {
        connection = this.connection = this.config.connection;
    }

    connection.on('connect', function () {
        self.emit('connectionReady', connection.getSessionid());
        self.sessionReady = true;
        self.testReadiness();
    });

    connection.on('message', function (message) {
        var peers = self.webrtc.getPeers(message.from, message.roomType);
        var peer;

        if (message.type === 'offer') {
            if (peers.length) {
                peers.forEach(function (p) {
                    if (p.sid == message.sid) peer = p;
                });
                //if (!peer) peer = peers[0]; // fallback for old protocol versions
            }
            if (!peer) {
                peer = self.webrtc.createPeer({
                    id: message.from,
                    sid: message.sid,
                                nickName: message.fromNickName,
                    type: message.roomType,
                    enableDataChannels: self.config.enableDataChannels && message.roomType !== 'screen',
                    sharemyscreen: message.roomType === 'screen' && !message.broadcaster,
                    broadcaster: message.roomType === 'screen' && !message.broadcaster ? self.connection.getSessionid() : null
                });
                self.emit('createdPeer', peer);
            }
            peer.handleMessage(message);
        } else if (peers.length) {
            peers.forEach(function (peer) {
                if (message.sid) {
                    if (peer.sid === message.sid) {
                        peer.handleMessage(message);
                    }
                } else {
                    peer.handleMessage(message);
                }
            });
        }
    });

    connection.on('remove', function (room) {
        if (room.id !== self.connection.getSessionid()) {
            self.webrtc.removePeers(room.id, room.type);
        }
    });

    // instantiate our main WebRTC helper
    // using same logger from logic here
    opts.logger = this.logger;
    opts.debug = false;
    this.webrtc = new WebRTC(opts);

    // attach a few methods from underlying lib to simple.
    ['mute', 'unmute', 'pauseVideo', 'resumeVideo', 'pause', 'resume', 'sendToAll', 'sendDirectlyToAll', 'getPeers'].forEach(function (method) {
        self[method] = self.webrtc[method].bind(self.webrtc);
    });

    // proxy events from WebRTC
    this.webrtc.on('*', function () {
        self.emit.apply(self, arguments);
    });

    // log all events in debug mode
    if (config.debug) {
        this.on('*', this.logger.log.bind(this.logger, 'SimpleWebRTC event:'));
    }

    // check for readiness
    this.webrtc.on('localStream', function () {
        self.testReadiness();
    });

    this.webrtc.on('message', function (payload) {
        self.connection.emit('message', payload);
    });

    this.webrtc.on('peerStreamAdded', this.handlePeerStreamAdded.bind(this));
    this.webrtc.on('peerStreamRemoved', this.handlePeerStreamRemoved.bind(this));
    this.webrtc.on('peerClosed', function(){
        this.emit('connectionClosed');
    });

    // echo cancellation attempts
    if (this.config.adjustPeerVolume) {
        this.webrtc.on('speaking', this.setVolumeForAll.bind(this, this.config.peerVolumeWhenSpeaking));
        this.webrtc.on('stoppedSpeaking', this.setVolumeForAll.bind(this, 1));
    }

    connection.on('stunservers', function (args) {
        // resets/overrides the config
                    //Changes url to urls
                    var length = args.length;
                    if (length > 0) {
                        self.webrtc.config.peerConnectionConfig.iceServers = [];
                        for (var i = 0; i < length; i++) {
                            if (args[i].url)
                                self.webrtc.config.peerConnectionConfig.iceServers.push({ "urls": args[i].url });
                            else
                                self.webrtc.config.peerConnectionConfig.iceServers.push(args[i]);
                        }
                    }
                    self.emit('stunservers', self.webrtc.config.peerConnectionConfig.iceServers);
    });
    connection.on('turnservers', function (args) {
        // appends to the config
        self.webrtc.config.peerConnectionConfig.iceServers = self.webrtc.config.peerConnectionConfig.iceServers.concat(args);
        self.emit('turnservers', args);
    });

    connection.on('loginjanusrequest', function (args) {
        var peer = self.webrtc.createPeer({
            id: 'janus',
            type: 'video',
           // nickName: client.nickName,
            mode: 'sender',
            //vidEncoder: client.vidEncoder,
            //vidBitrate: client.vidBitrate,
            //audEncoder: client.audEncoder,
            //audBitrate: client.audBitrate,
            enableDataChannels: false,
            receiveMedia: {
                offerToReceiveAudio: 1,
                offerToReceiveVideo: 1
            }
        });
        self.emit('createdPeer', peer);
        peer.start();
    });

    this.webrtc.on('iceFailed', function (peer) {
        // local ice failure
    });
    this.webrtc.on('connectivityError', function (peer) {
        // remote ice failure
        console.log("connectivityError")
    });


    // sending mute/unmute to all peers
    this.webrtc.on('audioOn', function () {
        self.webrtc.sendToAll('unmute', {name: 'audio'});
    });
    this.webrtc.on('audioOff', function () {
        self.webrtc.sendToAll('mute', {name: 'audio'});
    });
    this.webrtc.on('videoOn', function () {
        self.webrtc.sendToAll('unmute', {name: 'video'});
    });
    this.webrtc.on('videoOff', function () {
        self.webrtc.sendToAll('mute', {name: 'video'});
    });

    // screensharing events
    this.webrtc.on('localScreen', function (stream) {
        var item,
            el = document.createElement('video'),
            container = self.getRemoteVideoContainer();

        el.oncontextmenu = function () { return false; };
        el.id = 'localScreen';
        attachMediaStream(stream, el);
        if (container) {
            container.appendChild(el);
        }

        self.emit('localScreenAdded', el);
        self.connection.emit('shareScreen');

        self.webrtc.peers.forEach(function (existingPeer) {
            var peer;
            if (existingPeer.type === 'video') {
                peer = self.webrtc.createPeer({
                    id: existingPeer.id,
                                nickName: existingPeer.nickName,
                                mode: existingPeer.mode,
                    type: 'screen',
                    sharemyscreen: true,
                    enableDataChannels: false,
                    receiveMedia: {
                        offerToReceiveAudio: 0,
                        offerToReceiveVideo: 0
                    },
                    broadcaster: self.connection.getSessionid(),
                });
                self.emit('createdPeer', peer);
                peer.start();
            }
        });
    });
    this.webrtc.on('localScreenStopped', function (stream) {
        if (self.getLocalScreen()) {
            self.stopScreenShare();
        }
        /*
        self.connection.emit('unshareScreen');
        self.webrtc.peers.forEach(function (peer) {
            if (peer.sharemyscreen) {
                peer.end();
            }
        });
        */
    });

    this.webrtc.on('channelMessage', function (peer, label, data) {
        if (data.type == 'volume') {
            self.emit('remoteVolumeChange', peer, data.volume);
        }
        else
        {
            //console.log("ChannelMessage: ", data)
        }
    });

    if (this.config.autoRequestMedia) this.startLocalVideo();
}


SimpleWebRTC.prototype = Object.create(WildEmitter.prototype, {
    constructor: {
        value: SimpleWebRTC
    }
});

SimpleWebRTC.prototype.leaveRoom = function () {
    if (this.roomName) {
        this.connection.emit('leave');
        while (this.webrtc.peers.length) {
            this.webrtc.peers[0].end();
        }
        if (this.getLocalScreen()) {
            this.stopScreenShare();
        }
        this.emit('leftRoom', this.roomName);
        this.roomName = undefined;
    }
};

SimpleWebRTC.prototype.disconnect = function () {
    this.webrtc.peers.forEach(function (peer) {
        peer.end();
    });

    this.off('*')
    this.webrtc.off('*');
    if (typeof this.connection !== "undefined") 
    {
        this.connection?.disconnect();
    }

    delete this.connection;
};
///MLUpdate///
SimpleWebRTC.prototype.sendDataChannelMessageToAll = function (message) {
    this.webrtc.sendDirectlyToAll('simplewebrtc', 'custommessage', message);
};

SimpleWebRTC.prototype.sendDataChannelMessageToPeer = function (peerId, message) {
    var foundId = false;
    this.webrtc.peers.forEach(function (peer) {
        if (peer.enableDataChannels && peer.id == peerId) {
            peer.sendDirectly('simplewebrtc', 'custommessage', message);
            foundId = true;
        }
    });
    //Try to find peer by name
    if (!foundId) {
        this.webrtc.peers.forEach(function (peer) {
            if (peer.enableDataChannels && peer.nickName == peerId) {
                peer.sendDirectly('simplewebrtc', 'custommessage', message);
            }
        });
    }
};
///MLUpdate///

SimpleWebRTC.prototype.handlePeerStreamAdded = function (peer) {
    var self = this;
    var container = this.getRemoteVideoContainer();
    console.log("peer: ", peer)
    var video = attachMediaStream(peer.stream);

    // store video element as part of peer for easy removal
    peer.videoEl = video;
    video.id = this.getDomId(peer);

    if (container) container.appendChild(video);

    this.emit('videoAdded', video, peer);

    // send our mute status to new peer if we're muted
    // currently called with a small delay because it arrives before
    // the video element is created otherwise (which happens after
    // the async setRemoteDescription-createAnswer)
    window.setTimeout(function () {
        if (!self.webrtc.isAudioEnabled()) {
            peer.send('mute', {name: 'audio'});
        }
        if (!self.webrtc.isVideoEnabled()) {
            peer.send('mute', {name: 'video'});
        }
    }, 250);
};

SimpleWebRTC.prototype.handlePeerStreamRemoved = function (peer) {
    var container = this.getRemoteVideoContainer();
    var videoEl = peer.videoEl;
    if (this.config.autoRemoveVideos && container && videoEl) {
        container.removeChild(videoEl);
    }
    if (videoEl) this.emit('videoRemoved', videoEl, peer);
};

SimpleWebRTC.prototype.getDomId = function (peer) {
    return [peer.id, peer.type, peer.broadcaster ? 'broadcasting' : 'incoming'].join('_');
};

// set volume on video tag for all peers takse a value between 0 and 1
SimpleWebRTC.prototype.setVolumeForAll = function (volume) {
    this.webrtc.peers.forEach(function (peer) {
        if (peer.videoEl) peer.videoEl.volume = volume;
    });
};

SimpleWebRTC.prototype.joinRoom = function (name, cb) {
    var self = this;
    this.roomName = name;
    this.connection.emit('join', name, function (err, roomDescription) {
        console.log('join CB', err, roomDescription);
        if (err) {
            self.emit('error', err);
        } else {
            var id,
                client,
                type,
                peer;
            var counter=0;
            for (id in roomDescription.clients) {
                counter++;
                client = roomDescription.clients[id];
                for (type in client) {
                                if (self.config.target) {
                                    if (typeof client[type] === 'boolean' && client[type] && (id == self.config.target || client.nickName == self.config.target)) {
                                        peer = self.webrtc.createPeer({
                                            id: id,
                                            type: type,
                                            nickName: client.nickName,
                                            mode: client.mode,
                                            vidEncoder: client.vidEncoder,
                                            vidBitrate: client.vidBitrate,
                                            audEncoder: client.audEncoder,
                                            audBitrate: client.audBitrate,
                                            enableDataChannels: self.config.enableDataChannels && type !== 'screen',
                                            receiveMedia: {
                                                offerToReceiveAudio: type !== 'screen' && self.config.receiveMedia.offerToReceiveAudio ? 1 : 0,
                                                offerToReceiveVideo: self.config.receiveMedia.offerToReceiveVideo
                                            }
                                        });
                                        self.emit('createdPeer', peer);
                                        if (client.multicastType && client.multicastType == 'janus')
                                        {
                                            var janusLisnterMsg = { to: id, toName: client.nickName, type: 'januslistner'}
                                            self.connection.emit('message', janusLisnterMsg);
                                        }
                                        else
                                        peer.start();
                                    }
                                }
                                else {
                                    if (typeof client[type] === 'boolean' && client[type]) {
                        peer = self.webrtc.createPeer({
                            id: id,
                            type: type,
                                            nickName: client.nickName,
                                            mode: client.mode,
                                            vidEncoder: client.vidEncoder,
                                            vidBitrate: client.vidBitrate,
                                            audEncoder: client.audEncoder,
                                            audBitrate: client.audBitrate,
                            enableDataChannels: self.config.enableDataChannels && type !== 'screen',
                            receiveMedia: {
                                offerToReceiveAudio: type !== 'screen' && self.config.receiveMedia.offerToReceiveAudio ? 1 : 0,
                                offerToReceiveVideo: self.config.receiveMedia.offerToReceiveVideo
                            }
                        });
                        self.emit('createdPeer', peer);
                        peer.start();
                    }
                }
            }
        }
                    }

        if (cb) cb(err, roomDescription);
        self.emit('joinedRoom', name, counter);
    });
};

SimpleWebRTC.prototype.getEl = function (idOrEl) {
    if (typeof idOrEl === 'string') {
        return document.getElementById(idOrEl);
    } else {
        return idOrEl;
    }
};

SimpleWebRTC.prototype.startLocalVideo = function () {
    var self = this;
    console.log("SimpleWebRTC.prototype.startLocalVide: ", this.config.media);
    this.webrtc.start(this.config.media, function (err, stream) {
        console.log("this.webrtc.start");
        if (err) {
            console.log("localMediaError: ERROR: ", err);
            self.emit('localMediaError', err);
        } else {
            attachMediaStream(stream, self.getLocalVideoContainer(), self.config.localVideo);
            self.emit('localVideoStreamAdded', stream);
        }
    });
};

SimpleWebRTC.prototype.stopLocalVideo = function () {
    this.webrtc.stop();
};

// this accepts either element ID or element
// and either the video tag itself or a container
// that will be used to put the video tag into.
SimpleWebRTC.prototype.getLocalVideoContainer = function () {
    var el = this.getEl(this.config.localVideoEl);
    if (el && el.tagName === 'VIDEO') {
        el.oncontextmenu = function () { return false; };
        return el;
    } else if (el) {
        var video = document.createElement('video');
        video.oncontextmenu = function () { return false; };
        el.appendChild(video);
        return video;
    } else {
        return;
    }
};

SimpleWebRTC.prototype.getRemoteVideoContainer = function () {
    return this.getEl(this.config.remoteVideosEl);
};

SimpleWebRTC.prototype.shareScreen = function (cb) {
    this.webrtc.startScreenShare(cb);
};

SimpleWebRTC.prototype.getLocalScreen = function () {
    return this.webrtc.localScreens && this.webrtc.localScreens[0];
};

SimpleWebRTC.prototype.stopScreenShare = function () {
    this.connection.emit('unshareScreen');
    var videoEl = document.getElementById('localScreen');
    var container = this.getRemoteVideoContainer();

    if (this.config.autoRemoveVideos && container && videoEl) {
        container.removeChild(videoEl);
    }

    // a hack to emit the event the removes the video
    // element that we want
    if (videoEl) {
        this.emit('videoRemoved', videoEl);
    }
    if (this.getLocalScreen()) {
        this.webrtc.stopScreenShare();
    }
    this.webrtc.peers.forEach(function (peer) {
        if (peer.broadcaster) {
            peer.end();
        }
    });
};

SimpleWebRTC.prototype.testReadiness = function () {
    var self = this;
    if (this.sessionReady) {
            self.emit('readyToCall', self.connection.getSessionid());
                    //if (!this.config.media.video && !this.config.media.audio) {
                    //    self.emit('readyToCall', self.connection.getSessionid());
                    //} else if (this.webrtc.localStreams.length > 0) {
                    //    self.emit('readyToCall', self.connection.getSessionid());
                    //}
        }
};

SimpleWebRTC.prototype.createRoom = function (name, cb) {
    this.roomName = name;
    if (arguments.length === 2) {
        this.connection.emit('create', name, cb);
    } else {
        this.connection.emit('create', name);
    }
};

SimpleWebRTC.prototype.sendFile = function () {
    if (!webrtcSupport.dataChannel) {
        return this.emit('error', new Error('DataChannelNotSupported'));
    }

};
            SimpleWebRTC.prototype.getNickName = function () {
                if (this.nickName) {
                    return this.nickName;
                }
            };

            SimpleWebRTC.prototype.setNickName = function (nickName) {
                if (nickName && typeof nickName === 'string') {
                    this.nickName = nickName;
                    this.connection.emit('nickname', nickName)
                }
            };

            SimpleWebRTC.prototype.setInfo = function (nickName, strongId, mode, multicast) {
                if (arguments.length > 1) {
                    var nick = nickName || '';
                    var sId = strongId || '';
                    var mod = mode || '';
                    var mc = multicast || '';
                    if (nickName)
                        this.nickName = nickName;

                    if (strongId && !this.strongId) 
                        this.strongId = strongId;

                    if (mode)
                        this.mode = mode;

                    if (multicast)
                        this.multicastType = multicast;

                    this.connection.emit('setinfo', { nickName: nick, strongId: sId, mode: mod, multicastType: mc});
                }
                else if (arguments.length == 1 && typeof nickName == 'object') {
                    this.connection.emit('setinfo', nickName);
                }
            };

module.exports = SimpleWebRTC;