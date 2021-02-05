// Linting functions

// Generic function for creating an error object to pass to the app.
export function createErrorObject(node, type, message, value?) {
  let error = {
    message: "",
    type: "",
    node: "",
    value: ""
  };

  error.message = message;
  error.type = type;
  error.node = node;

  if (value !== undefined) {
    error.value = value;
  }

  return error;
}

// Determine a nodes fills
export function determineFill(fills) {
  let fillValues = [];

  fills.forEach(fill => {
    if (fill.type === "SOLID") {
      let rgbObj = convertColor(fill.color);
      fillValues.push(RGBToHex(rgbObj["r"], rgbObj["g"], rgbObj["b"]));
    } else if (fill.type === "IMAGE") {
      fillValues.push("Image - " + fill.imageHash);
    } else {
      const gradientValues = [];
      fill.gradientStops.forEach(gradientStops => {
        let gradientColorObject = convertColor(gradientStops.color);
        gradientValues.push(
          RGBToHex(
            gradientColorObject["r"],
            gradientColorObject["g"],
            gradientColorObject["b"]
          )
        );
      });
      let gradientValueString = gradientValues.toString();
      fillValues.push(`${fill.type} ${gradientValueString}`);
    }
  });

  return fillValues[0];
}

// Lint border radius
export function checkRadius(node, errors, radiusValues) {
  let cornerType = node.cornerRadius;

  if (typeof cornerType !== "symbol") {
    if (cornerType === 0) {
      return;
    }
  }

  // If the radius isn't even on all sides, check each corner.
  if (typeof cornerType === "symbol") {
    if (radiusValues.indexOf(node.topLeftRadius) === -1) {
      return errors.push(
        createErrorObject(
          node,
          "radius",
          "Incorrect Top Left Radius",
          node.topRightRadius
        )
      );
    } else if (radiusValues.indexOf(node.topRightRadius) === -1) {
      return errors.push(
        createErrorObject(
          node,
          "radius",
          "Incorrect top right radius",
          node.topRightRadius
        )
      );
    } else if (radiusValues.indexOf(node.bottomLeftRadius) === -1) {
      return errors.push(
        createErrorObject(
          node,
          "radius",
          "Incorrect bottom left radius",
          node.bottomLeftRadius
        )
      );
    } else if (radiusValues.indexOf(node.bottomRightRadius) === -1) {
      return errors.push(
        createErrorObject(
          node,
          "radius",
          "Incorrect bottom right radius",
          node.bottomRightRadius
        )
      );
    } else {
      return;
    }
  } else {
    if (radiusValues.indexOf(node.cornerRadius) === -1) {
      return errors.push(
        createErrorObject(
          node,
          "radius",
          "Incorrect border radius",
          node.cornerRadius
        )
      );
    } else {
      return;
    }
  }
}

// Check for effects like shadows, blurs etc.
export function checkEffects(node, errors) {
  if (node.effects.length) {
    if (node.effectStyleId === "") {
      const effectsArray = [];

      node.effects.forEach(effect => {
        let effectsObject = {
          type: "",
          radius: "",
          offsetX: "",
          offsetY: "",
          fill: "",
          value: ""
        };

        // All effects have a radius.
        effectsObject.radius = effect.radius;

        if (effect.type === "DROP_SHADOW") {
          effectsObject.type = "Drop Shadow";
        } else if (effect.type === "INNER_SHADOW") {
          effectsObject.type = "Inner Shadow";
        } else if (effect.type === "LAYER_BLUR") {
          effectsObject.type = "Layer Blur";
        } else {
          effectsObject.type = "Background Blur";
        }

        if (effect.color) {
          let effectsFill = convertColor(effect.color);
          effectsObject.fill = RGBToHex(
            effectsFill["r"],
            effectsFill["g"],
            effectsFill["b"]
          );
          effectsObject.offsetX = effect.offset.x;
          effectsObject.offsetY = effect.offset.y;
          effectsObject.value = `${effectsObject.type} ${effectsObject.fill} ${effectsObject.radius}px X: ${effectsObject.offsetX}, Y: ${effectsObject.offsetY}`;
        } else {
          effectsObject.value = `${effectsObject.type} ${effectsObject.radius}px`;
        }

        effectsArray.unshift(effectsObject);
      });

      let currentStyle = effectsArray[0].value;

      return errors.push(
        createErrorObject(
          node,
          "effects",
          "Missing effects style",
          currentStyle
        )
      );
    } else {
      return;
    }
  }
}

export function checkFills(node, errors) {
  if (node.fills.length && node.visible === true) {
    if (
      node.fillStyleId === "" &&
      node.fills[0].type !== "IMAGE" &&
      node.fills[0].visible === true
    ) {
      // We may need an array to loop through fill types.
      return errors.push(
        createErrorObject(
          node,
          "fill",
          "Missing fill style",
          determineFill(node.fills)
        )
      );
    } else {
      return;
    }
  }
}

export function checkBackgroundsForTextFills(node, errors) {
  const TextFills = [
    // Dark Theme
    "5c1691cbeaaf4270107d34f1a12f02fdd04afa02",
    "bc090cb3b1c7313ae276acbd791b5b87b478ec59",
    "5c77a96137b698b5575557c069cabd6877d66e1e",
    "5d84ad92f3ad152f196e2093a3c0542a08dfba11",
    "bf03232753079bdd5bec6c55343b659876b5283f",
    "287463bade90c1eed5ea4cb0b5d63794daa8aec2",
    "502dcdf04992818dcbaed125ad711b446dee4c68",
    "3eddc15e90bbd7064aea7cc13dc13e23a712f0b0",
    "fa698aa2a724522a7c29efb0a662aec75a1be5a1",
    // Light Theme
    "b19a14675b8adeb1528ab5f84e57b2eeed10d46c",
    "608f2ea1aa64ff7f202e8c22cc4147a02be9d85b",
    "546c7d46e754ac2b23b338783d72f206b77b6436",
    "7d8703ec132ddaf6968f6d190d1e80031c559d7c",
    "64d3058dd508a4985670b2d19418a06a3503c9c2",
    "9c23a031773711e026394f4354661c37ee5b4682",
    "e9542e95adf3bbe74286c2cf279fee64f7ba3279",
    "620c98e8f9255a6107dee91745669e5b702b413c",
    "9328cd78a39149b070d68f98d9fe4df7a92bf67d"
  ];

  let nodeFillStyle = node.fillStyleId;

  // We strip the additional style key characters so we can check
  // to see if the fill is being used incorrectly.
  nodeFillStyle = nodeFillStyle.replace("S:", "");
  nodeFillStyle = nodeFillStyle.split(",")[0];

  if (TextFills.includes(nodeFillStyle)) {
    return errors.push(
      createErrorObject(
        node,
        "fill",
        "Incorrect text color use",
        determineFill(node.fills)
      )
    );
  } else {
    checkFills(node, errors);
  }
}

export function checkTextForBackgroundFills(node, errors) {
  // Array of style keys we want to make sure aren't being used on text layers.
  const backgroundFills = [
    // Dark theme backgrounds
    "4b93d40f61be15e255e87948a715521c3ae957e6",
    "fb1358e5bd6dec072801298238cf49ff77b79a4b",
    "abf9ad88ae1ade1a4b945b012f0965c9cdc068c9",
    "ef179b6abe6cb8779857e05a6333d33f7a2b9320",
    "3dd0e30ce0a8287eb91ec1fbeff92031e634ed01",
    "11516f4b43f381afb5a6bdf2c34b9437f0eecde1",
    // Light theme backgrounds
    "2449a2983d43793d80baa20c6c60e8a48e7f3a0c",
    "83704278c845a6a7ceb1f837387972ccb6d41960",
    "6acd84c794796d112d4e9d22c4c8a5cae940a61d",
    "dbd02a76b7b77c1976114c04068f0fbc22015fab",
    "9328cd78a39149b070d68f98d9fe4df7a92bf67d",
    "6c8b08a42f9614842e880bf7bb795014d8fbae94"
  ];

  let nodeFillStyle = node.fillStyleId;

  // We strip the additional style key characters so we can check
  // to see if the fill is being used incorrectly.
  nodeFillStyle = nodeFillStyle.replace("S:", "");
  nodeFillStyle = nodeFillStyle.split(",")[0];

  if (backgroundFills.includes(nodeFillStyle)) {
    return errors.push(
      createErrorObject(
        node,
        "fill",
        "Incorrect background color use",
        determineFill(node.fills)
      )
    );
  } else {
    checkFills(node, errors);
  }
}

export function checkStrokes(node, errors) {
  if (node.strokes.length) {
    if (node.strokeStyleId === "" && node.visible === true) {
      let strokeObject = {
        strokeWeight: "",
        strokeAlign: "",
        strokeFills: []
      };

      strokeObject.strokeWeight = node.strokeWeight;
      strokeObject.strokeAlign = node.strokeAlign;
      strokeObject.strokeFills = determineFill(node.strokes);

      let currentStyle = `${strokeObject.strokeFills} / ${strokeObject.strokeWeight} / ${strokeObject.strokeAlign}`;

      return errors.push(
        createErrorObject(node, "stroke", "Missing stroke style", currentStyle)
      );
    } else {
      return;
    }
  }
}

export function checkType(node, errors) {
  if (node.textStyleId === "" && node.visible === true) {
    let textObject = {
      font: "",
      fontStyle: "",
      fontSize: "",
      lineHeight: {}
    };

    textObject.font = node.fontName.family;
    textObject.fontStyle = node.fontName.style;
    textObject.fontSize = node.fontSize;

    // Line height can be "auto" or a pixel value
    if (node.lineHeight.value !== undefined) {
      textObject.lineHeight = node.lineHeight.value;
    } else {
      textObject.lineHeight = "Auto";
    }

    let currentStyle = `${textObject.font} ${textObject.fontStyle} / ${textObject.fontSize} (${textObject.lineHeight} line-height)`;

    return errors.push(
      createErrorObject(node, "text", "Missing text style", currentStyle)
    );
  } else {
    return;
  }
}

// Utility functions for color conversion.
const convertColor = color => {
  const colorObj = color;
  const figmaColor = {};

  Object.entries(colorObj).forEach(cf => {
    const [key, value] = cf;

    if (["r", "g", "b"].includes(key)) {
      figmaColor[key] = (255 * (value as number)).toFixed(0);
    }
    if (key === "a") {
      figmaColor[key] = value;
    }
  });
  return figmaColor;
};

function RGBToHex(r, g, b) {
  r = Number(r).toString(16);
  g = Number(g).toString(16);
  b = Number(b).toString(16);

  if (r.length == 1) r = "0" + r;
  if (g.length == 1) g = "0" + g;
  if (b.length == 1) b = "0" + b;

  return "#" + r + g + b;
}
