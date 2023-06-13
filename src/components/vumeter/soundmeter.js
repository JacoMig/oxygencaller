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

export default SoundMeter;
// Meter class that generates a number correlated to audio volume.
// The meter class itself displays nothing, but it makes the
// instantaneous and time-decaying volumes available for inspection.
// It also reports on the fraction of samples that were at or near
// the top of the measurement range.
function SoundMeter(context, myMeterElement ) {
  this.context = context;
  this.instantR = 0.0;
  this.slowR = 0.0;
  this.clipR = 0.0;

  this.instantL = 0.0;
  this.slowL = 0.0;
  this.clipL = 0.0;
  this.script = context.createScriptProcessor(1024, 2,1);
  const that = this;

  this.script.onaudioprocess = function(event) {
    let input = event.inputBuffer.getChannelData(0);
    let i;
    let sum = 0.0;
    let clipcount = 0;
    for (i = 0; i < input.length; ++i) {
      sum += input[i] * input[i];
      if (Math.abs(input[i]) > 0.99) {
        clipcount += 1;
      }
    }
    that.instantL = Math.sqrt(sum / input.length);
    that.slowL = 0.95 * that.slowL + 0.05 * that.instantL;
    that.clipL = clipcount / input.length;

    if(event.inputBuffer.numberOfChannels >1)
    {
      input = event.inputBuffer.getChannelData(1);
      sum = 0.0;
      clipcount = 0;
      for (i = 0; i < input.length; ++i) {
        sum += input[i] * input[i];
        if (Math.abs(input[i]) > 0.99) {
          clipcount += 1;
        }
      }
      that.instantR = Math.sqrt(sum / input.length);
      that.slowR = 0.95 * that.slowR + 0.05 * that.instantR;
      that.clipR = clipcount / input.length;
    }
  };
}

SoundMeter.prototype.connectToSource = function(stream, callback) {
  console.log('SoundMeter connecting');
  try {
    this.mic = this.context.createMediaStreamSource(stream);
    this.mic.connect(this.script);
    // necessary to make sample run, but should not be.
    this.script.connect(this.context.destination);
    if (typeof callback !== 'undefined') {
      callback(null);
    }
  } catch (e) {
    console.error(e);
    if (typeof callback !== 'undefined') {
      callback(e);
    }
  }
};

SoundMeter.prototype.stop = function() {
  console.log('SoundMeter stopping');
  this.mic.disconnect();
  this.script.disconnect();
};
