# Design Doctor

A Figma widget that generates a frame with a list of components used in the Figma page that it is executed from.

![Plugin Cover](https://github.com/abbasdawood/design-doctor/assets/46668006/997f3553-b4da-4451-9297-628daf98c9fe)

## Motivation
As designers, we expect developers to copy the provided Mockup in a pixel perfect manner. But many a times, we forget to use the correct components as intended. Component growth is a dystopian nightmare. This plugin shows you the coverage of components from remote and local sources, hoping that you will reduce the local component coverage, and respect the design library that ought to be used. It is not a restrictive plugin, rather an informative one - just spilling out facts for you (the dseigner) to act upon.

The idea was inspired by what the lovely folks at [Razorpay](https://github.com/razorpay) are doing with their [Blade Coverage Plugin](https://github.com/razorpay/blade/tree/master/packages/plugin-figma-blade-coverage)

## Getting started
- Add the plugin from Figma Community
- Hit `Cmd / Ctrl + P` to open the quick access menu
- Type Design Doctor and hit return
- A widget will be created in some time on the page, with the details

## How does it work?
The plugin scans the current page from where it is invoked, scans all the Sections in it (Sections are a must as of now), all the Frames within the sections, and calculates the coverage of component instances used. It also mentions the remote components used as a list, the instances whose parents have been deleted / detached, and local components.

Coverage is calculated as 
`(Total Components - Local Components - Deleted Components) / Total Components`

## Who can use it?
- *Designers and Design Leads* - To validate whether you've been straying from the design system a lot, or is it intentional - and to see it as a number
- *Developers* - to get an idea of what components are being used in a use case / functionality / feature - so you can plan your componentisation better

## Contributing
I plan to keep this project open source, with moderated contributions. Create an Issue on this repo, to get access and suggest enhancements.

### Setup and Development
Below are the steps to get your widget running. You can also find instructions at:

https://www.figma.com/widget-docs/setup-guide/

This widget template uses TypeScript and NPM, two standard tools in creating JavaScript applications.

First, download Node.js which comes with NPM. This will allow you to install TypeScript and other
libraries. You can find the download link here:

https://nodejs.org/en/download/

Next, install TypeScript, esbuild and the latest type definitions by running:

npm install

If you are familiar with JavaScript, TypeScript will look very familiar. In fact, valid JavaScript code
is already valid Typescript code.

TypeScript adds type annotations to variables. This allows code editors such as Visual Studio Code
to provide information about the Figma API while you are writing code, as well as help catch bugs
you previously didn't notice.

For more information, visit https://www.typescriptlang.org/

Using TypeScript requires a compiler to convert TypeScript (widget-src/code.tsx) into JavaScript (dist/code.js)
for the browser to run. We use esbuild to do this for us.

We recommend writing TypeScript code using Visual Studio code:

1. Download Visual Studio Code if you haven't already: https://code.visualstudio.com/.
2. Open this directory in Visual Studio Code.
3. Compile TypeScript to JavaScript: Run the "Terminal > Run Build Task..." menu item,
   then select "npm: watch". You will have to do this again every time
   you reopen Visual Studio Code.

That's it! Visual Studio Code will regenerate the JavaScript file every time you save.
