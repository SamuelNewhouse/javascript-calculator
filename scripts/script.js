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
  
  // Order Of Operations Grouping...
  // Select all consecutive multiplications and divisions as a group,
  // and select additions and subtractions as individual numbers.
  // var reOOOGrouping = /(?:[\-\+]*[\.\d]+(?:[x/][\-\+]*[\d\.]+)+|[\-\+]*[\.\d]+)/g;
  function calculateString(str, orderOfOps) {    
    var result = simplifySigns(str);
    var strArray = [];
    var numArray = [];
    var reOOOGrouping = /(?:[\-\+]*[\.\d]+(?:[x/][\-\+]*[\d\.]+)+|[\-\+]*[\.\d]+)/g;
    var reMultOrDiv = /[x/]/;

    strArray = result.match(reOOOGrouping);

    for ( var i = 0; i < strArray.length; i++ ) {			
      var subStr = strArray[i];
      var multDivIndex = subStr.search(reMultOrDiv);			

      if ( multDivIndex !== -1 ) {
				var curVal = parseFloat(subStr.slice(0, multDivIndex)); // Left hand number.
				var	operator = subStr.slice(multDivIndex, multDivIndex + 1); // Operator.
				var rightHandIndex = undefined;
				var rightHand = undefined;
				while ( multDivIndex !== -1) {
					subStr = subStr.slice(multDivIndex + 1); // Right hand plus everything else
					multDivIndex = subStr.search(reMultOrDiv); // End of right hand.
					rightHandIndex = multDivIndex > -1 ? multDivIndex : subStr.length; // End of one number or end of string?
					rightHand = parseFloat(subStr.slice(0, rightHandIndex)); // Right hand number.

					if ( operator === 'x' )
						curVal *= rightHand;
					else
						curVal /= rightHand;					
					
					operator = subStr.slice(multDivIndex, multDivIndex + 1);
				}
				numArray.push(curVal);
			}				
		}
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
      inputString = inputString.substring(0, charLimit - 4);
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