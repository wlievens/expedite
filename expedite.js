;(function ($, window, document, undefined) {

    'use strict';

    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.

    // window and document are passed through as local variables rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    // Create the defaults once
    var pluginName = 'expedite';
    var defaults = {
        parenScale: 25,
        expression: [],
        operators: ['=', '≠', '≥', '>', '≤', '<', '+', '-', '×', '/']
    };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var maxDepth = this.getMaxDepth(this.settings.expression);
            var $tree = this.populate(this.settings.expression, 0, maxDepth);
            $(this.element).addClass('expedite');
            $(this.element).append($tree);
        },
        getMaxDepth: function (expression) {
            var depth = 0;
            for (var n = 1; n < expression.length; ++n) {
                depth = Math.max(depth, this.getMaxDepth(expression[n]) + 1);
            }
            return depth;
        },
        populate: function (expression, depth, maxDepth) {
            var $span = $('<span>');

            if (expression.length == 3) {
                this.populateBinaryInfix($span, expression, depth, maxDepth);
            } else if (expression.length == 2) {
                this.populateUnaryPrefix($span, expression, depth, maxDepth);
            } else if (typeof expression === 'number') {
                // Nullary number

                $span.addClass('expedite-number');
                $span.append(expression);
            } else {
                // Nullary variable

                $span.addClass('expedite-variable');
                $span.append(expression);
            }
            return $span;
        },
        populateBinaryInfix: function ($span, expression, depth, maxDepth) {
            var parenSize = (100 + (maxDepth - depth) * this.settings.parenScale) + '%';

            var $paren1 = $('<span>(</span>');
            $paren1.addClass('expedite-paren');
            $paren1.css('font-size', parenSize);
            $span.append($paren1);

            var $operator = $('<span>');
            $operator.addClass('expedite-operator');
            $operator.text(expression[0]);

            var $inner = $('<span>');
            $inner.append(this.populate(expression[1], depth + 1, maxDepth));
            $inner.append($operator);
            $inner.append(this.populate(expression[2], depth + 1, maxDepth));
            $span.append($inner);

            var $paren2 = $('<span>)</span>');
            $paren2.addClass('expedite-paren');
            $paren2.css('font-size', parenSize);
            $span.append($paren2);

            $operator.click(function() {
                $options = $('<div>');
                $.each(this.settings.operators, function() {
                    var operator = this;
                    $options.add(operator);
                });
            });

            var hoverIn = function () {
                $paren1.addClass('expedite-outer-highlight');
                $paren2.addClass('expedite-outer-highlight');
                $inner.addClass('expedite-inner-highlight');
            };

            var hoverOut = function () {
                $paren1.removeClass('expedite-outer-highlight');
                $paren2.removeClass('expedite-outer-highlight');
                $inner.removeClass('expedite-inner-highlight');
            };

            $paren1.hover(hoverIn, hoverOut);
            $paren2.hover(hoverIn, hoverOut);
        },
        populateUnaryPrefix: function ($span, expression, depth, maxDepth) {
           var $operator = $('<span>');
           $operator.addClass('expedite-operator');
           $operator.text(expression[0]);

           $span.append($operator);
           $span.append(this.populate(expression[1], depth + 1, maxDepth));
       }
    });

// A really lightweight plugin wrapper around the constructor,
// preventing against multiple instantiations
    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' +
                    pluginName, new Plugin(this, options));
            }
        });
    };
})
(jQuery, window, document);
