$(function() {
  var charLimit = 18;
  var isError = false;
  
  var keyButtons = {
    cbDot: { type: "dot", symbol: "." }, "cb0": { type: "number", symbol: "0" },
    cb1: { type: "number", symbol: "1" }, "cb2": { type: "number", symbol: "2" },
    cb3: { type: "number", symbol: "3" }, "cb4": { type: "number", symbol: "4" },
    cb5: { type: "number", symbol: "5" }, "cb6": { type: "number", symbol: "6" },
    cb7: { type: "number", symbol: "7" }, "cb8": { type: "number", symbol: "8" },
    cb9: { type: "number", symbol: "9" },
    cbMultiply: { type: "operation", symbol: "x" }, "cbDivide": { type: "operation", symbol: "/" },
    cbAdd: { type: "operation", symbol: "+" }, "cbSubtract": { type: "subtract", symbol: "-" },
    cbCE: { type: "CE", symbol: undefined }, "cbAC": { type: "AC", symbol: undefined },
    cbEquals: { type: "equals", symbol: undefined },

    getSymbolType: function (symbol) {
      var keyArray = Object.keys(this);
      var that = this;
      var targetKey = keyArray.filter( function(element) { return that[element].symbol === symbol; } );
      return this[targetKey[0]].type;
    }
  }

  function simplifySigns (str) {
    var selPosNeg = /[\+\-]+/g;
    var selNeg = /\-/g;
    str = str.replace(selPosNeg, function (match) {
      var negCount = ( match.match(selNeg) || [] ).length;
      if ( negCount % 2 === 0 )
        return "+";
      else
        return "-";
    });
    return str;
  }
  
  function toNoSciNotation (num) {
    return num.toFixed(20).replace(/\.?0+$/,"");
  }

  function multiplyDivide (str) {
    function doMultiply(str) {
      var result = "";
      var operands = str.split("x");
      var leftHand = parseFloat(operands[0]);
      var rightHand = parseFloat(operands[1]);
      var calculation = leftHand * rightHand;      
      result = "+";
      return result + toNoSciNotation(calculation);
    }
    function doDivide(str) {
      var result = "";
      var operands = str.split("/");
      var leftHand = parseFloat(operands[0]);
      var rightHand = parseFloat(operands[1]);
      if ( rightHand === 0 ) {
        isError = true;
        return "Division by 0";
      }
      var calculation = leftHand / rightHand;
      result = "+";
      return result + toNoSciNotation(calculation);
    }
    function hasMult(str) { return str.indexOf("x") !== -1; }
    function hasDiv(str) { return str.indexOf("/") !== -1; }

    var selection = /[\-\+]*[\.\d]+(\x|\/)[\-\+]*[\d\.]+/;
    str = simplifySigns(str);
    var result = str;
    while( hasMult(result) || hasDiv(result) ) {
      result = result.replace(selection, function (match) {
        if ( hasMult(match) )
          return doMultiply(match);
        else if ( hasDiv(match) )
          return doDivide(match);
        else
          return match;
      });
      result = simplifySigns(result);
    }
    return result;
  }
  
  function addSubtract (str) {
    var selection = /[\-\+]*[\.\d]+(\+|\-)[\-\+]*[\d\.]+/;
    var leftRightSel = /([\-\+]*[\.\d]+)/g;
    
    str = simplifySigns(str);       
    var match = str.match(selection)    
    while( match !== null ) {
      str = str.replace(selection, function (match) {
        var result = "+";
        var leftRightMatches = match.match(leftRightSel);
        var leftHand = parseFloat(leftRightMatches[0]);
        var rightHand = parseFloat(leftRightMatches[1]);
        var calculation = leftHand + rightHand;
        return result + toNoSciNotation(calculation);
      });
      str = simplifySigns(str);
      match = str.match(selection)
    };
    str = simplifySigns(str);
    return str;
  }
  
  function calculateString(str, orderOfOps) {
    var result = str;
    
    result = multiplyDivide(result);
    result = addSubtract(result);
    return result;
  }

  function updateNumDisplay(str) {
    $("#numDisplay").html(str);
  }

  var inputString = "";
  var lastSymbol = "";
  var lastSymbolType = "none";
  
  function keyPadHandler () {
    var id = $(this).attr("id");
    var keyData = keyButtons[id];
    var keyType = keyData.type;
    var keySymbol = keyData.symbol;
    
    var allowSymbol = false;
    
    if( isError ) {
      if ( keyType === "CE" || keyType === "AC" ) {
        inputString = "";
        lastSymbol = "";
        lastSymbolType = "none";
        isError = false;
      }
      else {
        return;
      }
    }
    
    function setLastSymbolInfo() {
      lastSymbol = inputString.slice(-1);
      if ( inputString.length > 0 )        
        lastSymbolType = keyButtons.getSymbolType(lastSymbol);
      else
        lastSymbolType = "none";
    }
    
    if ( keyType === "dot" && lastSymbolType !== "dot") {
      allowSymbol = true;
    } else if ( keyType === "number" ) {
      allowSymbol = true;
    } else if ( keyType === "subtract" && lastSymbolType !== "dot" ) {
      allowSymbol = true;
    } else if ( keyType === "operation" && lastSymbolType === "number") {
      allowSymbol = true;
    } else if ( keyType === "CE" && inputString.length > 0 ) {
      inputString = inputString.slice(0, -1);      
      setLastSymbolInfo();
    } else if ( keyType === "AC" && inputString.length > 0 ) {
      inputString = "";
      lastSymbol = "";
      lastSymbolType = "none";
    }
    else if ( keyType === "equals" && inputString.length > 0 && lastSymbolType === "number") {
      inputString = calculateString(inputString, true);
      if ( inputString.match(/e/) ) {
        isError = true;        
        inputString = "Number limit exceeded.";        
      }
      inputString = inputString.substring(0, charLimit - 4); // 
      inputString = inputString.replace(/\.?0+$/,""); // Trim trailing zeroes.
      setLastSymbolInfo();
    }
    
    if ( allowSymbol && inputString.length < charLimit) {
      inputString += keySymbol;
      lastSymbol = keySymbol;
      lastSymbolType = keyType;
    }    
   
    updateNumDisplay(inputString);
  }

  $("button").each( function() {
    $(this).click(keyPadHandler);
  });
});