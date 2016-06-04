# Functions

## (wave [type] [length] [fs]) => `node`

| Param | Type | Description |
| --- | --- | --- |
| type | <code>symbol</code> | The shape of the wave: `sine`, `square`, `sawtooth`, `triangle` |
| length | <code>number</code> | Play time (sec) |
| fs | <code>number</code> | The frequence of the wave (Hz) |

Generates a periodic waveform, like a sine wave.

## (sound [file] [rate]) => `node`

| Param | Type | Description |
| --- | --- | --- |
| file | <code>string</code> | The name of an audio file |
| rate | <code>number</code> | (optional) The speed factor of the sound |

Loads an audio file. The demo provides `audio.ogg` and can't load any other files due to the Same-origin policy.

## (gain [value] [nodes] [mod]) => `node`

| Param | Type | Description |
| --- | --- | --- |
| value | <code>number</code> | The amount of gain |
| nodes | <code>node</code> or <code>list</code> | input node |
| mod | <code>number</code> | (optional) Modulation node that modulates the amount of gain. In particular, you can use this for amplitude modulation. |

Changes the volume (amplitude) of the inputted sound(s). 

## (compose [nodes]) => `node`

Composes the sounds given by a list.

## (delay [value] [nodes] [mod]) => `node`

| Param | Type | Description |
| --- | --- | --- |
| value | <code>number</code> | The length of delay (sec) |
| nodes | <code>node</code> or <code>list</code> | input node |
| mod | <code>number</code> | (optional) Modulation node that modulates the amount of delay. In particular, you can use this for frequency modulation. |

Makes a delay-line of the inputted sound(s)

## (sequence [nodes]) => `node`

| Param | Type | Description |
| --- | --- | --- |
| nodes | <code>list</code> | input node |

Arranges sounds in sequence. You can make a musical score by `sequence`.
To make a rest in the score, use `(wait [sec])` in a list.


## (filter [type] [arguments...]) => `node`

| Param | Type | Description |
| --- | --- | --- |
| type | <code>list</code> | Type of the filter |

Makes a simple low-order filter. The first argument is the type of the filter and the rest differ by the type.

* `(filter 'lowpass [freq] [Q])`
* `(filter 'highpass [freq] [Q])`
* `(filter 'bandpass [freq] [Q])`
* `(filter 'lowshelf [freq] [gain])`
* `(filter 'highshelf [freq] [gain])`
* `(filter 'peaking [freq] [Q] [gain])`
* `(filter 'notch [freq] [Q])`
* `(filter 'allpass [freq] [Q])`

The meaning of each filter and its arguments, see https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode#Properties