/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';
//https://esonderegger.github.io/web-audio-peak-meter/
const webAudioPeakMeter = require('web-audio-peak-meter');

export default PeakMeter;
// Meter class that generates a number correlated to audio volume.
// The meter class itself displays nothing, but it makes the
// instantaneous and time-decaying volumes available for inspection.
// It also reports on the fraction of samples that were at or near
// the top of the measurement range.
function PeakMeter(context, myMeterElement, name ) {
  this.context = context;
  this.myMeterElement=myMeterElement;
  this.name=name;
//   this.webAudioPeakMeter=new webAudioPeakMeter.WebAudioPeakMeter();
}

PeakMeter.prototype.connectToSource = function(stream, callback)
{
  
    console.log("PeakMEter Name: ", this.name)
    var sourceNode = this.context.createMediaStreamSource(stream);
    console.log("Sourcenode 1: ", sourceNode)
    console.log("destination: ", this.context.destination)
    sourceNode.connect( this.context.destination);
    console.log("Sourcenode 2: ", sourceNode)
    this.webAudioPeakMeter=new webAudioPeakMeter.WebAudioPeakMeter(sourceNode, this.myMeterElement);
    this.context.resume();


    console.log("webAudioPeakMeter channel count: ", this.webAudioPeakMeter.channelCount)
};

PeakMeter.prototype.getChannelCount = function() {
  return this.webAudioPeakMeter.channelCount;
};

PeakMeter.prototype.getValues = function() {
    return this.webAudioPeakMeter.getPeaks();
  };
PeakMeter.prototype.stop = function() {
  this.webAudioPeakMeter.cleanup();
};
