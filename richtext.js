/*!
 * RichText component v1.0
 *
 * @author Serge Galich <gaserge@mail.ru>
 * @copyright 2025
 * @license MIT
 * @website http://qujs.ru/richtext/
 * 
 * @requires Qu
 */

(function(global) {
    'use strict';
    
    const LIB_NAME = 'RichText';
    const DATA_PREFIX = 'qu-richtext';
    const QU_PREFIX = 'qu';

    if (global.Qu && global.Qu[LIB_NAME]) {
        global.Qu.debug(`⚠️ [${LIB_NAME}] Already registered, skipping duplicate`);
        return;
    }

    let Qu = null;
    let _initOnce = false;

    const DEFAULT_RICHTEXT_BUTTONS = [
        { type: 'b',    label: 'B',    title: '<b>',             before: '<b>',              after: '</b>' },
        { type: 'i',    label: 'I',    title: '<i>',             before: '<i>',              after: '</i>' },
        { type: 'u',    label: 'U',    title: '<u>',             before: '<u>',              after: '</u>' },
        { type: 's',    label: 'S',    title: '<s>',             before: '<s>',              after: '</s>' },
        { type: 'separator' },
        { type: 'ul',   label: 'UL',   title: '<ul>',            before: '<ul>\n<li>',       after: '</li>\n<li></li>\n<li></li>\n</ul>', formatN: true },
        { type: 'ol',   label: 'OL',   title: '<ol>',            before: '<ol>\n<li>',       after: '</li>\n<li></li>\n<li></li>\n</ol>', formatN: true },
        { type: 'separator' },
        { type: 'q',    label: '„ “',  title: '<blockquote>',    before: '<blockquote>',     after: '</blockquote>', formatN: true },
        { type: 'code', label: '</>',  title: '<code>',          before: '<code>',           after: '</code>', formatN: true },
        { type: 'separator' },
        { type: 'a',    label: 'URL',  title: '<a href="">',     before: '<a href="">',      after: '</a>' },
        { type: 'img',  label: 'IMG',  title: '<img src="">' },
    ];

    const _defaultConfig = {
        buttons: DEFAULT_RICHTEXT_BUTTONS,
    };

    function Constructor(params = {}) {
        this._config = Object.assign({}, _defaultConfig);
        Object.assign(this._config, params);
    };
    Constructor._debug = false; // true by default
    Constructor.libName = LIB_NAME;

    
    Constructor._setData = function(el, name, value, prefix = DATA_PREFIX) {
        const attrName = `data-${prefix}-${name}`;
        if (value === undefined) {
            el.setAttribute(attrName, '');
        } else {
            el.setAttribute(attrName, value);
        }
    };

    Constructor._getData = function(el, name, prefix = DATA_PREFIX) {
        if (!el || typeof el.getAttribute !== 'function') {
            return null;
        }
        return el.getAttribute(`data-${prefix}-${name}`);
    };

    Constructor._hasData = function(el, name, prefix = DATA_PREFIX) {
        if (!el || typeof el.hasAttribute !== 'function') {
            return false;
        }
        return el.hasAttribute(`data-${prefix}-${name}`);
    };

    Constructor._removeData = function(el, name, prefix = DATA_PREFIX) {
        el.removeAttribute(`data-${prefix}-${name}`);
    };

    Constructor._getDataAttrName = function(name, prefix = DATA_PREFIX) {
        return `data-${prefix}-${name}`;
    };

    Constructor._Qu = {

        debug: function(...args) {
            if (Qu && Qu.debug) return Qu.debug(...args);
            console.log(...args)
        },

        on: function(el, ev, handler, opts) {
            if (Qu && Qu.on) { return Qu.on(el, ev, handler, opts); }
            
            if (typeof ev !== 'string' && ev.addEventListener) {
                if (typeof el === 'string') {
                    el = el.split(' ').filter(e => e.trim());
                }

                el.forEach(el => {
                    ev.addEventListener(el.trim(), handler, opts);
                });
                return;
            }
            
            if (typeof ev === 'string') {
                if (typeof el === 'string') {
                    el = el.split(' ').filter(e => e.trim());
                }
                el.forEach(el => {
                    document.addEventListener(el.trim(), function(event) {
                        const target = event.target.closest(ev);
                        if (target) {
                            event._target = target;
                            handler(event);
                        }
                    }, opts);
                });
                
                return;
            }
        },
    };

    
    Constructor.use = function (fn) {
        if (typeof fn === 'function') {
          fn(Constructor);
        }
    };

    Constructor.extend = function () {
        if (Array.isArray(global[LIB_NAME + 'Extend'])) {
          global[LIB_NAME + 'Extend'].forEach((fn) => {
            Constructor.use(fn);
          });
          global[LIB_NAME + 'Extend'] = [];
        }
    };     
    Constructor._customHandlers = {};

    Constructor.registerHandler = function(type, handler) {
        Constructor._customHandlers[type] = handler;
    };

    Constructor.loaded = function(quInstance) {
        Qu = quInstance;
        Constructor.extend();
        Constructor.debug(`📗 [${LIB_NAME}] loaded`);
    };

    
    Constructor.debug = function(...args) {
        if (!Constructor._debug) return;
        Constructor._Qu.debug(...args);
    },

    Constructor.initOnce = function(params = {}) {
        if(_initOnce === true) return;
        _initOnce = true;
    };

    
    Constructor.init = function(quInstance, params = {}) {
        Qu = quInstance;
        
        Constructor.initOnce(params);
        Constructor.config(params);
        Constructor.debug(`⚙️ [${LIB_NAME}] init`, _defaultConfig);
    };

    Constructor.config = function(options) {
        Object.assign(_defaultConfig, options);
        return Constructor;
    };


    Constructor.prototype = {
        constructor: Constructor,

        use: function(fn) {
            if (typeof fn === 'function') {
                fn(this);
            }
        },

        test: function(){
            return 'test Richtext';
        },

        init: function(textarea) {
            if (!textarea) {
                return this;
            }
            this._initHtmlToolbar(textarea);
            this._autoGrowTextarea(textarea);
            return this;
        },

        _wrapSelectionTag: function (textarea, before, after, btn) {
            const type = Constructor._getData(btn, 'format-n');
            const start = textarea.selectionStart;
            const end   = textarea.selectionEnd;
            const value = textarea.value;

            if (Boolean(type) === true) {
                const lineStart = value.lastIndexOf('\n', start - 1) + 1;
                const beforeText = value.slice(lineStart, start);
                
                if (beforeText.trim() !== '') {
                    before = '\n' + before;
                }
                
                const lineEnd = value.indexOf('\n', end);
                const afterText = lineEnd === -1 ? value.slice(end) : value.slice(end, lineEnd);
                
                if (afterText.trim() !== '') {
                    after = after + '\n';
                }
            }
        
            if (start === end) {
                const insert = before + after;
                textarea.value = value.slice(0, start) + insert + value.slice(end);
            
                const pos = start + before.length;
                textarea.selectionStart = textarea.selectionEnd = pos;
                textarea.focus();
                return;
            }
        
            const selected = value.slice(start, end);
            const wrapped  = before + selected + after;
        
            textarea.value = value.slice(0, start) + wrapped + value.slice(end);
        
            textarea.selectionStart = start;
            textarea.selectionEnd   = start + wrapped.length;
            textarea.focus();
        },

        _autoGrowTextarea: function (ta) {
            const dialog = ta.closest('dialog');
    
            if (dialog) {
                // В диалоге - просто ставим фиксированную высоту
            }

            const style = window.getComputedStyle(ta);
            const borderY =
              parseInt(style.borderTopWidth, 10) +
              parseInt(style.borderBottomWidth, 10);
          
            const resize = () => {
              ta.style.height = 'auto';
              ta.style.height = (ta.scrollHeight + borderY) + 'px';
            };
          
            resize();

            if (!Constructor._hasData(ta, 'auto-grow')) {
                Constructor._Qu.on('input', ta, resize);
                Constructor._setData(ta, 'auto-grow', '1');
                ta._Resize = resize;
            }
          
            return resize;
        },

        _createRichtextToolbar: function () {
            const toolbar = document.createElement('div');
            Constructor._setData(toolbar, 'toolbar', '');
          
            const buttons = this._config.buttons && this._config.buttons.length
              ? this._config.buttons
              : DEFAULT_RICHTEXT_BUTTONS;

            if (!this._config.buttons || !this._config.buttons.length) {
                this._config.buttons = buttons;
            }
          
            buttons.forEach((btn) => {
                if (btn.type === 'separator') {
                    const sep = document.createElement('span');
                    Constructor._setData(sep, 'separator', '');
                    sep.className = 'richtext-separator';
                    toolbar.appendChild(sep);
                } else {
                    const b = document.createElement('button');
                    b.type = 'button';
                    Constructor._setData(b, 'button', '');
                    Constructor._setData(b, 'type', btn.type);
                    if (btn.before) Constructor._setData(b, 'before', btn.before);
                    if (btn.after) Constructor._setData(b, 'after', btn.after);
                    if (btn.formatN) Constructor._setData(b, 'format-n', btn.formatN);
                    b.textContent = btn.label;
                    b.title       = btn.title || '';
                    toolbar.appendChild(b);
                }
            });
          
            return toolbar;
        },
        
        _initHtmlToolbar: function (textarea) {
            if (Constructor._hasData(textarea, 'inited')) {
                return;
            }
        
            const wrapper  = document.createElement('div');
            Constructor._setData(wrapper, 'wrapper', '');

            const toolbar = this._createRichtextToolbar();
        
            const parent = textarea.parentNode;
            parent.insertBefore(wrapper, textarea);
            wrapper.appendChild(toolbar);
            wrapper.appendChild(textarea);
            
            Constructor.debug(`🧩 [${LIB_NAME}] applied to element`, {
                element: textarea,
                config: this._config
            })

            this._autoGrowTextarea(textarea);

            Constructor._Qu.on('mousedown', toolbar, (e) => {
                const btn = e.target.closest(`button[${Constructor._getDataAttrName('button')}]`);
                if (!btn) return;
              
                e.preventDefault(); 
                e.stopPropagation();
            });
        
            Constructor._Qu.on('click', toolbar, (e) => {
                const btn = e.target.closest(`button[${Constructor._getDataAttrName('button')}]`);
                if (!btn) return;

                e.preventDefault(); 
                e.stopPropagation();
            
                const type = Constructor._getData(btn, 'type');
                const value = textarea.value;
                const start = textarea.selectionStart;
                const end   = textarea.selectionEnd;

                let before = Constructor._getData(btn, 'before') || '';
                let after = Constructor._getData(btn, 'after') || '';
            
                if (type === 'b' || type === 'i' || type === 'u' ||
                    type === 's' || type === 'code' || type === 'a') {
            
                    if (type === 'a') {
                        const url = prompt('Ссылка (https://...)', 'https://');
                        if (!url) return;
                        before = `<a href="${url}">`;
                    }
            
                    this._wrapSelectionTag(textarea, before, after, btn);
                    this._autoGrowTextarea(textarea);
                    return;
                }

                if (type === 'img') {
                    const url = prompt('Image URL');
                    if (!url) return;
                
                    const imgTag = '<img src="' + url + '">';
                    this._wrapSelectionTag(textarea, imgTag, '', btn);
                    return;
                }
            
                const selected = value.slice(start, end);
            
                if (type === 'ul' || type === 'ol') {
                    if (start === end) {
                        this._wrapSelectionTag(textarea, before, after, btn);
                        this._autoGrowTextarea(textarea);
                        return;
                    }

                    const lines = selected.split(/\r?\n/).filter(line => line.trim() !== '');
                    if (!lines.length) { return; }
            
                    const li = lines.map(line => `<li>${line}</li>`).join('\n');
                    const wrapped = type === 'ul'
                        ? `<ul>\n${li}\n</ul>`
                        : `<ol>\n${li}\n</ol>`;
            
                    textarea.value = value.slice(0, start) + wrapped + value.slice(end);
            
                    textarea.selectionStart = start;
                    textarea.selectionEnd   = start + wrapped.length;
                    textarea.focus();

                    this._autoGrowTextarea(textarea);
                    return;
                } 
            
                if (type === 'q') {
                    if (start === end) {
                        this._wrapSelectionTag(textarea, before, after, btn);
                        this._autoGrowTextarea(textarea);
                        return;
                    }

                    const wrapped = `<blockquote>${selected}</blockquote>`;
                    textarea.value = value.slice(0, start) + wrapped + value.slice(end);
            
                    textarea.selectionStart = start;
                    textarea.selectionEnd   = start + wrapped.length;
                    textarea.focus();

                    this._autoGrowTextarea(textarea);
                    return;
                }

                if (Constructor._customHandlers[type]) {
                    return Constructor._customHandlers[type].call(this, {
                        textarea,
                        btn,
                        start,
                        end,
                        value,
                        selection: value.slice(start, end),
                        before: Constructor._getData(btn, 'before') || '',
                        after: Constructor._getData(btn, 'after') || '',
                        formatN: Constructor._getData(btn, 'format-n') || '',
                    });
                };

                this._wrapSelectionTag(textarea, before, after, btn);
                this._autoGrowTextarea(textarea);
                return;
            });
        
            Constructor._setData(textarea, 'inited', '1');
        },
    }


    if (global.Qu) {
        global.Qu.lib(LIB_NAME, Constructor);
    } else {
        global._QuLibs = global._QuLibs || [];
        global._QuLibs.push({ name: LIB_NAME, instance: Constructor });
    }

})(typeof window !== 'undefined' ? window : global);