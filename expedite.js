;(function ($, window, document, undefined) {

    'use strict';

    // Setup plugin name
    var pluginName = 'expedite';

    // Create the defaults
    var defaults = {
        parenScale: 25,
        expression: [],
        operators: {
            infix: ['=', '≠', '≥', '>', '≤', '<', '+', '-', '×', '/', 'and', 'or', 'xor'],
            prefix: ['-', 'not'],
            grid: 6
        }
    };

    // Plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    $.extend(Plugin.prototype, {

        init: function () {
            var maxDepth = this.getMaxDepth(this.settings.expression);
            var $tree = this.populate([this.settings.expression], 0, 0, maxDepth);
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

        populate: function (parent, index, depth, maxDepth) {
            var expression = parent[index];

            if (expression.length == 3) {
                return this.populateBinaryInfix(expression, depth, maxDepth);
            }

            if (expression.length == 2) {
                return this.populateUnaryPrefix($span, expression, depth, maxDepth);
            }

            if (typeof expression === 'number') {
                // Nullary number

                var self = this;

                $span = $('<input>');

                $span.addClass('expedite-number');
                $span.val(expression);

                var updateWidth = function() {
                    var $temp = $('<span>');
                    $temp.css('visibility', 'hidden');
                    $temp.text($span.val());
                    $(self.element).append($temp);
                    $temp.ready(function() {
                        console.log($temp.outerWidth());
                        $span.css('width', Math.max(8, $temp.outerWidth()) + 'px');
                        $temp.remove();
                    });
                };

                updateWidth();
                $span.keydown(function() {
                    $span.ready(updateWidth);
                });
                $span.change(function() {
                    $span.blur();
                    parent[index] = $span.val();
                });

                return $span;
            }

            // Nullary variable

            var $span = $('<span>');
            $span.data('expression', expression);
            $span.addClass('expedite-variable');
            $span.append(expression);
            return $span;
        },

        showOptionsPopup: function ($operator, expression, operators) {
            var settings = this.settings;
            var current = $operator.text();
            var $options = $('<div>');
            var count = 0;
            $.each(operators, function() {
                var operator = this;
                if (operator == current) {
                    return;
                }
                var $option = $('<span>');
                $option.addClass('expedite-operator');
                $option.text(operator);
                $option.click(function() {
                    expression[0] = operator;
                    $operator.text(operator);
                    $options.fadeOut('fast', function() {
                        $(this).remove();
                    });
                });
                $options.mouseleave(function() {
                    $options.fadeOut('fast', function() {
                        $(this).remove();
                    });
                });
                $options.append($option);
                ++count;
                if (count % settings.operators.grid == 0) {
                    $options.append('<br>');
                }
            });
            $('body').append($options);
            var position = $operator.position();
            $options.addClass('expedite');
            $options.addClass('expedite-popup');
            $options.css({
                'left': position.left,
                'top': position.top
            });
            $options.animate({ opacity: 'toggle', height: 'toggle' }, 'fast');
        },

        populateBinaryInfix: function (expression, depth, maxDepth) {
            var self = this;

            var parenSize = (100 + (maxDepth - depth) * self.settings.parenScale) + '%';

            var $span = $('<span>');

            var $paren1 = $('<span>');
            $paren1.text('(');
            $paren1.addClass('expedite-paren');
            $paren1.css('font-size', parenSize);
            $span.append($paren1);

            var $operator = $('<span>');
            $operator.addClass('expedite-operator');
            $operator.text(expression[0]);

            var $inner = $('<span>');
            $inner.append(this.populate(expression, 1, depth + 1, maxDepth));
            $inner.append($operator);
            $inner.append(this.populate(expression, 2, depth + 1, maxDepth));
            $span.append($inner);

            var $paren2 = $('<span>');
            $paren2.text(')');
            $paren2.addClass('expedite-paren');
            $paren2.css('font-size', parenSize);
            $span.append($paren2);

            $operator.click(function() {
                self.showOptionsPopup($operator, expression, self.settings.operators.infix);
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

            return $span;
        },

        populateUnaryPrefix: function ($span, expression, depth, maxDepth) {
            var self = this;

            var $span = $('<span>');

            var $operator = $('<span>');
            $operator.addClass('expedite-operator');
            $operator.text(expression[0]);

            $span.append($operator);
            $span.append(this.populate(expression, 1, depth + 1, maxDepth));

            $operator.click(function() {
                self.showOptionsPopup($operator, expression, self.settings.operators.prefix);
            });

            return $span;
       }
    });

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
