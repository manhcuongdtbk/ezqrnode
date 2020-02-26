# EzQRNode

EzQRNode is a NodeJS server side QRCode image generator. Support setting Dot style, Logo, Background image, Colorful, Title and more.

## Feature

- Save QRCode image file without DOM on server side
- Support save PNG, JPG image file
- Support get standard base64 image data url text: `data:image/png;base64, ...`
- Support custom dot style, color, scale
- Support for Quiet Zone settings
- Support custom Position Pattern inner fill and outer border color
- Support custom Alignment Pattern inner fill and outer border color
- Support custom Timing Patterns vertical, horizontal color and scale
- Support Logo images (including transparent PNG images)
- Support Background Image
- Support for title, subtitle settings
- Support QR Code rotation

## Basic Usages

```JS
const QRCode = require('easyqrcodejs-nodejs-extended');

// Options
var options = {
  text: "cuong.bui@tomosia.com"
};

// New instance with options
var qrcode = new QRCode(options);

// Save QRCode image
qrcode.saveImage({
  path: 'q.png' // save path
});
```

## QRCode API

### Object

```JS
var qrcode = new QRCode(options);
```

- Options

  ```JS
   var options = {
      // ====== Basic
      text: "cuong.bui@tomosia.com",
      width: 256,
      height: 256,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H, // L, M, Q, H
      dotScale: 1 // Must be greater than 0, less than or equal to 1. default is 1

      // ====== Quiet Zone
      /*
      quietZone: 0,
      quietZoneColor: 'transparent',
      */

      // ====== Logo
      /*
      logo:"../demo/logo.png", // Relative address, relative to `easy.qrcode.min.js`
      logo:"http://127.0.0.1:8020/easy-qrcodejs/demo/logo.png",
      logoWidth:80, // widht. default is automatic width
      logoHeight:80 // height. default is automatic height
      logoBackgroundColor:'#fffff', // Logo backgroud color, Invalid when `logBgTransparent` is true; default is '#ffffff'
      logoBackgroundTransparent:false, // Whether use transparent image, default is false
      */

      // ====== Backgroud Image
      /*
      backgroundImage: '', // Background Image
      backgroundImageAlpha: 1, // Background image transparency, value between 0 and 1. default is 1.
      autoColor: false,
      */

      // ====== Colorful
      // === Posotion Pattern(Eye) Color
      /*
      PO: '#e1622f', // Global Posotion Outer color. if not set, the defaut is `colorDark`
      PI: '#aa5b71', // Global Posotion Inner color. if not set, the defaut is `colorDark`
      PO_TL:'', // Posotion Outer color - Top Left
      PI_TL:'', // Posotion Inner color - Top Left
      PO_TR:'', // Posotion Outer color - Top Right
      PI_TR:'', // Posotion Inner color - Top Right
      PO_BL:'', // Posotion Outer color - Bottom Left
      PI_BL:'', // Posotion Inner color - Bottom Left
      */
      // === Alignment Color
      /*
      AO: '', // Alignment Outer. if not set, the defaut is `colorDark`
      AI: '', // Alignment Inner. if not set, the defaut is `colorDark`
      */
      // === Timing Pattern Color
      /*
      timing: '#e1622f', // Global Timing color. if not set, the defaut is `colorDark`
      timing_H: '', // Horizontal timing color
      timing_V: '', // Vertical timing color
      */

      // ====== Title
      /*
      title: 'QR Title', // content
      titleFont: "bold 18px Arial", //font. default is "bold 16px Arial"
      titleColor: "#004284", // color. default is "#000"
      titleBackgroundColor: "#fff", // background color. default is "#fff"
      titleHeight: 70, // height, including subTitle. default is 0
      titleTop: 25, // draws y coordinates. default is 30
      */

      // ====== SubTitle
      /*
      subTitle: 'QR subTitle', // content
      subTitleFont: "14px Arial", // font. default is "14px Arial"
      subTitleColor: "#004284", // color. default is "4F4F4F"
      subTitleTop: 40, // draws y coordinates. default is 0
      */

      // ===== Event Handler
      /*
      onRenderingStart: undefined,
      */

      // ==== Images format
      /*
      format: 'PNG', // 'PNG', 'JPG'
      compressionLevel: 6, // ZLIB compression level (0-9). default is 6
      quality: 0.75, // An object specifying the quality (0 to 1). default is 0.75. (JPGs only)
      */

      // ==== Versions
      /*
      version: 0 // The symbol versions of QR Code range from Version 1 to Version 40. default 0 means automatically choose the closest version based on the text length.

      */

      // ==== Dot Style
      /*
      dotStyle: 'rectangle' // A string represents dot style. default is 'rectangle'.
      */

     // ==== Timing style
     /*
     timingStyle: 'rectangle', // A string represents timing style. default is 'rectangle'
     */

    // ==== Position style
    /*
    positionStyle: 'rectangle', // A string represents position style. default is 'rectangle'
    */

    // ==== Alignment style
    /*
    alignmentStyle: 'rectangle', // 'A string represents alignment style. default is 'rectangle'
    */

    // ==== Degree Rotation
    /*
    degreeRotation: 0, // An integer number represents dot style. default is 0
    */
  }
  ```

  | Option | Required | Type | Defaults | Description |
  | --- | --- |--- | --- |--- |
  | Basic options| --- | ---|---|---|
  | **text** | Y | String |`''` |  Text |
  | **width** | N | Number | `256` |  Width |
  | **height** | N | Number | `256` |  Height |
  | **colorDark** | N | String | `#000000` | Dark CSS color |
  | **colorLight** | N | String | `#ffffff` | Light CSS color |
  | **correctLevel** | N | Enum | `QRCode.CorrectLevel.H` | `QRCode.CorrectLevel.H`<br/>`QRCode.CorrectLevel.Q` <br/> `QRCode.CorrectLevel.M` <br/> `QRCode.CorrectLevel.L`|
  | **dotScale** | N | Number | `1.0` |Dot style required Patterns. Ranges: `0-1.0` |
  | **dotStyle** | N | String | `rectangle` | `rectangle`<br/>`roundedRectangle`<br/>`circle` |
    | Quiet Zone| --- | ---|---|---|
    | **quietZone** | N | Number | `0` |  Quiet Zone size |
    | **quietZoneColor** | N | String | `transparent` |  Background CSS color to Quiet Zone |
  | Logo options| --- | ---|---|---|
  | **logo** | N | String | `undefined` | Logo Image Path. If use relative address, relative to `easy.qrcode.min.js` |
  | **logoWidth** | N | Number | `undefined` |  Height |
  | **logoHeight** | N | Number | `undefined` |  Width |
  | **logoBackgroundTransparent** | N | Boolean | `false` |  Whether the background transparent image(`PNG`) shows transparency. When `true`, `logoBackgroundColor` is invalid |
  | **logoBackgroundColor** | N | String | `#ffffff` |  Set Background CSS Color when image background transparent. Valid when `logoBackgroundTransparent` is `false` |
  | Backgroud Image options|  ---|--- |---|---|
  | **backgroundImage** | N | String | `undefined` | Background Image Path. If use relative address, relative to `easy.qrcode.min.js` |
  | **backgroundImageAlpha** | N | Number | `1.0` |  Background image transparency. Ranges: `0-1.0`  |
  | **autoColor** | N | Boolean | `false` |  Automatic color adjustment |
  | Posotion Pattern Color options| --- | ---|---|---|
  | **PO** | N | String | `undefined` | Global Posotion Outer CSS color. if not set, the defaut is `colorDark` |
  | **PI** | N | String | `undefined` | Global Posotion Inner CSS color. if not set, the defaut is `colorDark` |
  | **PO_TL** | N | String | `undefined` | Posotion Outer CSS color - Top Left |
  | **PI_TL** | N | String | `undefined` | Posotion Inner CSS color - Top Left |
  | **PO_TR** | N | String | `undefined` | Posotion Outer CSS color - Top Right |
  | **PI_TR** | N | String | `undefined` | Posotion Inner CSS color - Top Right |
  | **PO_BL** | N | String | `undefined` | Posotion Outer CSS color - Bottom Left |
  | **PI_BL** | N | String | `undefined` | Posotion Inner CSS color - Bottom Left |
  | Timing Style| --- | ---|---|---|
  | **timingStyle** | N | String | `rectangle` | Style of the timing pattern<br/>`rectangle`<br/>`roundedRectangle`
  | Position Style| --- | ---|---|---|
  | **positionStyle** | N | String | `rectangle` | Style of the position pattern<br/>`rectangle`<br/>`roundedRectangle`<br/>`circle`
  | Alignment Style| --- | ---|---|---|
  | **alignmentStyle** | N | String | `rectangle` | Style of the alignment pattern<br/>`rectangle`<br/>`roundedRectangle`<br/>`circle`
  | Alignment Color options| --- |--- |---|---|
  | **AO** | N | String | `undefined` | Alignment Outer CSS color. if not set, the defaut is `colorDark` |
  | **AI** | N | String | `undefined` | Alignment Inner CSS color. if not set, the defaut is `colorDark` |
  | Timing Pattern Color options| --- | ---|---|---|
  | **timing** | N | String | `undefined` | Global Timing CSS color. if not set, the defaut is `colorDark` |
  | **timing_H** | N | String | `undefined` | Horizontal timing CSS color |
  | **timing_V** | N | String | `undefined` | Vertical timing CSS color |
  | Title options| --- | ---|---|---|
  | **title** | N | String | `''` |  |
  | **titleFont** | N | String | `bold 16px Arial` | CSS Font |
  | **titleColor** | N | String | `#000000` | CSS color |
  | **titleBackgroundColor** | N | String | `#ffffff` | CSS color|
  | **titleHeight** | N | Number | `0` | Title Height, Include subTitle |
  | **titleTop** | N | Number | `30` | draws y coordinates.|
  | SubTitle options| --- | ---|---|---|
  | **subTitle** | N | String | `''` |  |
  | **subTitleFont** | N | String | `14px Arial` | CSS Font |
  | **subTitleColor** | N | String | `#4F4F4F` | CSS color |
  | **subTitleTop** | N | Number | `0` | draws y coordinates. default is 0|
  | Event Handler options| --- | ---|---|---|
  | **onRenderingStart(qrCodeOptions)** | N | Function | `undefined` | Callback function when rendering start work. can use to hide loading state or handling.  |
  | Images format options| --- | ---|---|---|
    | **format** | N | String | `PNG` | 'PNG' or 'JPG'  |
  | **compressionLevel** | N | Number | `6` | ZLIB compression level between 0 and 9. (**PNGs only**)  |
  | **quality** | N | Number | `0.75` | An object specifying the quality (0 to 1). (**JPGs only**)  |
  | Version options| --- | ---|---|---|
    | **version** | N | Number | `0` | The symbol versions of QR Code range from Version `1` to Version `40`. default 0 means automatically choose the closest version based on the text length.  [Information capacity and versions of QR Codes](https://www.qrcode.com/en/about/version.html) **NOTE**: If you set a value less than the minimum version available for text, the minimum version is automatically used. |
  | Rotation| --- | ---|---|---|
    | **degreeRotation** | N | Number | `0` | `0`<br/>`90`<br/>`180`<br/>`270`

### Methods

- **saveImage(ImagesFormatOptions)**

  ```JS
  //  Save PNG Images to file
  qrcode.saveImage({
    path: 'q.png' // file path
  });
  ```

- **toDataURL()**

  ```JS
  // Get standard base64 image data url text: 'data:image/png;base64, ...'
  qrcode.toDataURL().then(data=>{
    console.info('======QRCode PNG DataURL======')
    console.info(data)
  });
  ```

## DEVELOPMENT

### DOCKER

1. Install docker and docker-compose
2. Up all services

   ```console
   docker-compose up -d
   ```

3. Test AWS Lambda handler

   ```console
   docker-compose exec ezqrnode bash
   node handler-cli-test.js
   ```

### CREATE THE COMPLETE AWS LAMBDA FUNCTION

An AWS Lambda Function is a folder that contains the handler file and all of it dependencies.

For better development, we should develop the whole AWS Lambda Function locally then zip all of its content and upload the zip file to use on AWS Lambda Function.

After finish developing, run this zip command (all hidden files and folders are automatically ignored):

```console
zip -r -X -x "node_modules/*" "Dockerfile" "docker-compose.yml" "package*.json" "README.md" "handler-cli-caller.js" -9 "ezqrnode.zip" *
```

The zip file will be in the same folder with the ezqrnode development folder, named **ezqrnode.zip**.

### PROBLEMS AND SOLUTIONS

1. Node canvas is not fully compatible with AWS Lambda Function

    - [libuuid.so.1: cannot open shared object file: No such file or directory](https://github.com/Automattic/node-canvas/issues/1448)
    - [node_modules/canvas/build/Release/canvas.node: invalid ELF header](https://github.com/Automattic/node-canvas/issues/1231#issuecomment-417995088)

## PRODUCTION

Always set up AWS Lambda Function in the following order:

- Main function **ezqrnode.zip**
- Node12Canvas layer
- CanvasLib64 layer

**Explaination**:

- The main function layer only contains the handler for AWS Lambda Function and the custom qr code generator library. It can not run without the 2 next layers. At this developing moment (2020-02-26), the node _canvas_ package and Amazon's custom AMI doesn't fit so well (missing some libraries).

- Node12Canvas layer contains the node _canvas_ package version 2.6.1. It's the required package to draw the QR Code. You can not use something like a Mac OS / Windows generated node_mudles package because its binary files will not compatible with Amazon's custom AMI

- CanvasLib64 layer contains the missing libraries for node _canvas_ to run on Amazon's custom AMI. Without them, you will receive "libuuid.so.1: cannot open shared object file: No such file or directory" error message
