# Livewire Devtools

Debug your Livewire component state.

<p align="center"><img src="https://raw.githubusercontent.com/beyondcode/livewire-devtools/master/media/screenshot-shadow.png" alt="screenshot"></p>

### Installation

This extension does not yet have a stable version publicly available.


### Manual Installation

1. Clone this repo
2. `npm install` (Or `yarn install` if you are using yarn as the package manager)
3. `npm run build`
4. Open Chrome extension page
5. Check "developer mode"
6. Click "load unpacked extension", and choose `shells/chrome`.

### Hacking

1. Clone this repo
2. `npm install`
3. `npm run dev`
4. A plain shell with a test app will be available at `localhost:8080`.

### Testing as Firefox addon

 1. Install `web-ext`

	~~~~
	$ npm install --global web-ext
	~~~~

	Or, for Yarn:

	~~~~
	$ yarn global add web-ext
	~~~~

	Also, make sure `PATH` is set up. Something like this in `~/.bash_profile`:

	~~~~
	$ PATH=$PATH:$(yarn global bin)
	~~~~

 2. Build and run in Firefox

	~~~~
	$ npm run build
	$ npm run run:firefox
	~~~~

	When using Yarn, just replace `npm` with `yarn`.


### License

Thanks goes out to Vue devtools, which were used as a starting point for this.

[MIT](http://opensource.org/licenses/MIT)
