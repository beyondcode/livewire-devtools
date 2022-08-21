# Livewire Devtools

Debug your Livewire component state from within your browser.

<p align="center"><img src="https://raw.githubusercontent.com/rw4lll/livewire-devtools/master/media/screenshot-shadow.png" alt="screenshot"></p>

### Roadmap
- ~~Chrome Manifest V3 support~~
- Code clean up
- Update dependencies and deprecated parts
- Check FF extension
- Vue3 && Typescript
- ...

### Installation

For Chromium-based browsers (Chrome, Edge, Chromium etc.): https://chrome.google.com/webstore/detail/livewire-devtools/dnociedgpnpfnbkafoiilldfhpcjmikd
For Firefox (on moderation). Can be installed manually. (see "Manual Installation (Firefox)" section).


### Manual Installation (Chrome)

1. Clone this repo
2. `npm install` (Or `yarn install` if you are using yarn as the package manager)
3. `npm run build`
4. Open Chrome extension page (chrome://extensions)
5. Check "developer mode"
6. Click "load unpacked extension", and choose `shells/chrome`.

### Hacking

1. Clone this repo
2. `npm install`
3. `npm run dev`
4. A plain shell with a test app will be available at `localhost:8100`.

### Manual Installation (Firefox)

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
	$ npm run build:ff
	$ npm run run:firefox
	~~~~

	When using Yarn, just replace `npm` with `yarn`.
	
 3. Open "about:addons" in Firefox browser, then click "Install from file" and select built zip-folder.	


### License

Thanks goes out to Vue devtools, which were used as a starting point for this.

[MIT](http://opensource.org/licenses/MIT)
