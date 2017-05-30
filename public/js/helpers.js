var register = function(Handlebars) {
  var helpers = {
    inc: function(value, options) {
      return parseInt(value) + 1;
    },
    foo: function(var1, var2) {
        return parseInt(value) - 1;
    },
    ifEquals: function(arg1, arg2, options) {
      if(arg1 == arg2) {
        return options.fn(this);
      }
      return options.inverse(this);
    },
    ifNotEquals: function(arg1, arg2, options) {
      if(arg1 != arg2) {
        return options.fn(this);
      }
      return options.inverse(this);
    }
  };

  if (Handlebars && typeof Handlebars.registerHelper === "function") {
    for (var prop in helpers) {
      Handlebars.registerHelper(prop, helpers[prop]);
    }
  } else {
    return helpers;
  }

};

module.exports.register = register;
module.exports.helpers = register(null); 