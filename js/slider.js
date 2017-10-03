(function ($, Vel) {
  'use strict';

  let _defaults = {
    indicators: true,
    height: 400,
    duration: 500,
    interval: 6000
  };


  /**
   * @class
   *
   */
  class Slider {
    /**
     * Construct Slider instance and set up overlay
     * @constructor
     * @param {Element} el
     * @param {Object} options
     */
    constructor(el, options) {

      // If exists, destroy and reinitialize
      if (!!el.M_Slider) {
        el.M_Slider.destroy();
      }

      this.el = el;
      this.$el = $(el);
      this.el.M_Slider = this;

      /**
       * Options for the modal
       * @member Slider#options
       * @prop {Boolean} [indicators=true] - Show indicators
       * @prop {Number} [height=400] - height of slider
       * @prop {Number} [duration=500] - Length in ms of slide transition
       * @prop {Number} [interval=6000] - Length in ms of slide interval
       */
      this.options = $.extend({}, Slider.defaults, options);

      // setup
      this.$slider = this.$el.find('.slides');
      this.$slides = this.$slider.children('li');
      this.activeIndex = this.$slider.find('.active').index();
      if (this.activeIndex != -1) {
        this.$active = this.$slides.eq(this.activeIndex);
      }

      this._setSliderHeight();

      // Set initial positions of captions
      this.$slides.find('.caption').each((el) => {
        this._animateCaptionIn(el, 0);
      });

      // Move img src into background-image
      this.$slides.find('img').each((el) => {
        let placeholderBase64 = 'data:image/gif;base64,R0lGODlhAQABAIABAP///wAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
        if ($(el).attr('src') !== placeholderBase64) {
          $(el).css('background-image', 'url("' + $(el).attr('src') + '")' );
          $(el).attr('src', placeholderBase64);
        }
      });

      this._setupIndicators();

      // Show active slide
      if (this.$active) {
        this.$active.css('display', 'block');
      }
      else {
        this.$slides.first().addClass('active');
        Vel(
          this.$slides.first()[0],
          {opacity: 1},
          {duration: this.options.duration, queue: false, easing: 'easeOutQuad'}
        );

        this.activeIndex = 0;
        this.$active = this.$slides.eq(this.activeIndex);

        // Update indicators
        if (this.options.indicators) {
          this.$indicators.eq(this.activeIndex).addClass('active');
        }
      }

      // Adjust height to current slide
      this.$active.find('img').each((el) => {
        Vel(
          this.$active.find('.caption')[0],
          {opacity: 1, translateX: 0, translateY: 0},
          {duration: this.options.duration, queue: false, easing: 'easeOutQuad'}
        );
      });

      this._setupEventHandlers();

      // auto scroll
      this.start();
    }

    static get defaults() {
      return _defaults;
    }

    static init($els, options) {
      let arr = [];
      $els.each(function() {
        arr.push(new Slider(this, options));
      });
      return arr;
    }

    /**
     * Get Instance
     */
    getInstance() {
      return this;
    }

    /**
     * Teardown component
     */
    destroy() {
      this.pause();
      this._removeIndicators();
      this._removeEventHandlers();
      this.el.M_Slider = undefined;
    }

    /**
     * Setup Event Handlers
     */
    _setupEventHandlers() {
      this._handleIntervalBound = this._handleInterval.bind(this);
      this._handleIndicatorClickBound = this._handleIndicatorClick.bind(this);

      if (this.options.indicators) {
        this.$indicators.each((el) => {
          el.addEventListener('click', this._handleIndicatorClickBound);
        });
      }
    }

    /**
     * Remove Event Handlers
     */
    _removeEventHandlers() {
      if (this.options.indicators) {
        this.$indicators.each((el) => {
          el.removeEventListener('click', this._handleIndicatorClickBound);
        });
      }
    }

    /**
     * Handle indicator click
     * @param {Event} e
     */
    _handleIndicatorClick(e) {
      let currIndex = $(e.target).index();
      this.set(currIndex);
    }

    /**
     * Handle Interval
     */
    _handleInterval() {
      let newActiveIndex = this.$slider.find('.active').index();
      if (this.$slides.length === newActiveIndex + 1) newActiveIndex = 0; // loop to start
      else newActiveIndex += 1;

      this.set(newActiveIndex);
    }

    /**
     * Animate in caption
     * @param {Element} caption
     * @param {Number} duration
     */
    _animateCaptionIn(caption, duration) {
      let velocityOptions = {
        opacity: 0
      };

      if ($(caption).hasClass('center-align')) {
        velocityOptions.translateY = -100;

      } else if ($(caption).hasClass('right-align')) {
        velocityOptions.translateX = 100;

      } else if ($(caption).hasClass('left-align')) {
        velocityOptions.translateX = -100;
      }

      Vel(
        caption,
        velocityOptions,
        {duration: duration, queue: false}
      );
    }

    /**
     * Set height of slider
     */
    _setSliderHeight() {
      // If fullscreen, do nothing
      if (!this.$el.hasClass('fullscreen')) {
        if (this.options.indicators) {
          // Add height if indicators are present
          this.$el.css('height', (this.options.height + 40) + 'px');
        }
        else {
          this.$el.css('height', this.options.height + 'px');
        }
        this.$slider.css('height', this.options.height + 'px');
      }
    }

    /**
     * Setup indicators
     */
    _setupIndicators() {
      if (this.options.indicators) {
        this.$indicators = $('<ul class="indicators"></ul>');
        this.$slides.each((el, index) => {
          let $indicator = $('<li class="indicator-item"></li>');
          this.$indicators.append($indicator[0]);
        });
        this.$el.append(this.$indicators[0]);
        this.$indicators = this.$indicators.children('li.indicator-item');
      }
    }

    /**
     * Remove indicators
     */
    _removeIndicators() {
      this.$el.find('ul.indicators').remove();
    }

    /**
     * Cycle to nth item
     * @param {Number} index
     */
    set(index) {
      // Wrap around indices.
      if (index >= this.$slides.length) index = 0;
      else if (index < 0) index = this.$slides.length -1;

      // Only do if index changes
      if (this.activeIndex != index) {
        this.$active = this.$slides.eq(this.activeIndex);
        let $caption = this.$active.find('.caption');

        this.$active.removeClass('active');
        Vel(
          this.$active[0],
          {opacity: 0},
          {duration: this.options.duration, queue: false, easing: 'easeOutQuad',
            complete: (() => {
              this.$slides.not('.active').each((el) => {
                Vel(
                  el,
                  {opacity: 0, translateX: 0, translateY: 0},
                  {duration: 0, queue: false}
                );
              });
            }).bind(this)
          }
        );

        this._animateCaptionIn($caption[0], this.options.duration);

        // Update indicators
        if (this.options.indicators) {
          this.$indicators.eq(this.activeIndex).removeClass('active');
          this.$indicators.eq(index).addClass('active');
        }

        Vel(
          this.$slides.eq(index)[0],
          {opacity: 1},
          {duration: this.options.duration, queue: false, easing: 'easeOutQuad'}
        );
        Vel(
          this.$slides.eq(index).find('.caption')[0],
          {opacity: 1, translateX: 0, translateY: 0},
          {duration: this.options.duration, delay: this.options.duration, queue: false, easing: 'easeOutQuad'}
        );

        this.$slides.eq(index).addClass('active');
        this.activeIndex = index;

        // Reset interval
        this.start();
      }
    }

    /**
     * Pause slider interval
     */
    pause() {
      clearInterval(this.interval);
    }

    /**
     * Start slider interval
     */
    start() {
      clearInterval(this.interval);
      this.interval = setInterval(
        this._handleIntervalBound, this.options.duration + this.options.interval
      );
    }

    /**
     * Move to next slide
     */
    next() {
      let newIndex = this.activeIndex + 1;

      // Wrap around indices.
      if (newIndex >= this.$slides.length) newIndex = 0;
      else if (newIndex < 0) newIndex = this.$slides.length -1;

      this.set(newIndex);
    }

    /**
     * Move to previous slide
     */
    prev() {
      let newIndex = this.activeIndex - 1;

      // Wrap around indices.
      if (newIndex >= this.$slides.length) newIndex = 0;
      else if (newIndex < 0) newIndex = this.$slides.length -1;

      this.set(newIndex);
    }
  }

  Materialize.Slider = Slider;

  jQuery.fn.slider = function(methodOrOptions) {
    // Call plugin method if valid method name is passed in
    if (Slider.prototype[methodOrOptions]) {
      // Getter methods
      if (methodOrOptions.slice(0,3) === 'get') {
        return this.first()[0].M_Slider[methodOrOptions]();

      // Void methods
      } else {
        return this.each(function() {
          this.M_Slider[methodOrOptions]();
        });
      }

    // Initialize plugin if options or no argument is passed in
    } else if ( typeof methodOrOptions === 'object' || ! methodOrOptions ) {
      Slider.init(this, arguments[0]);
      return this;

    // Return error if an unrecognized  method name is passed in
    } else {
      jQuery.error(`Method ${methodOrOptions} does not exist on jQuery.slider`);
    }
  };

}(cash, Materialize.Vel));
