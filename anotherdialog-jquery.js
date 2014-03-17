
(function(window, $, undefined){
    
    $.anotherdialog = function( _settings )
    {
        if(!$.isPlainObject(_settings))
        {
            _settings = { content: { body: _settings } };
        }


        _settings = $.extend(true,
        {
            csssettings:{
                            file:               'dialog.css',
                            insertafter:        $(window.document).find('head > title,head > link,head > style').last(), //-- deferred function, css selector string, jQuery obj, dom element, $.ajax: insert the dialog css after something
                            classshowfull:      'modal-full',
                            classshowregular:   'modal'
                        },

            css:        {                           //-- shift dialog position, populate with any CSS key value pair like: top, bottom, left, right, height, minHeight, width
                            minHeight:  '90%',
                            width:      '90%'
                        },

            windowclose:true,                       //-- background click to close dialog

            cache:      true,                       //-- boolean: cache the dialog content or don't if you need to reload, else reloads everytime you "show" the dialog

            appendto:   $('body'),                  //-- deferred function, css selector string, jQuery obj, dom element, $.ajax: append the dialog to something

            fullsize:   false,                      //-- boolean: make the dialog full screen

            content:    {                           //-- content object
                            header: null,           //-- deferred function, html string, dom element, $.ajax: append the content to the dialog
                            body:   null,
                            footer: null,
                            left:   null,
                            right:  null
                        },

            template:   {
                            header:     '<div class="modal-header">{0}</div>',
                            body:       '<div class="modal-body">{0}</div>',
                            footer:     '<div class="modal-footer">{0}</div>',
                            left:       '<div class="modal-left">{0}</div>',
                            right:      '<div class="modal-right">{0}</div>',
                            wrap:       '<div class="modal-inner">{1}{0}{3}{4}{2}</div>',
                            complete:   '<div class="modal">{0}</div>'
                        }
        }, _settings);
        

        //-- global cache for reset
        var _globalself             = $.anotherdialog;
            _globalself.csscache    = (_globalself.csscache)? _globalself.csscache : []; //-- store css references
            _globalself.cache       = (_globalself.cache)? _globalself.cache : []; //-- store dialogs for on/off
            _globalself.active      = (_globalself.active)? _globalself.active : null;


        //-- internal storage
        var _data =
        {
            numbertimeson:  0,
            previous:       null,
            deferred:       null,
            promise:        null,
            html:           $('html'),
            dialogparent:   null,
            cssafter:       null,
            cssloaded:      false,
            dialog:         {}
        };


        //-- Start Everything
        function AnotherDialog()
        {
            _data.deferred = new $.Deferred();
            _data.promise = _data.deferred.promise();

            if(_settings.content.body)
            {
                SetElements();
            }
            else
            {
                Error.call(this, '_settings.content.body is null or undefined');
            }
        }


        //-- Step 1, get then set dialog and css parents
        function SetElements()
        {
            var events      = _settings.events,
                parent      = _settings.appendto,
                cssafter    = _settings.csssettings.insertafter;

            $.when(
                   GetElement(parent),
                   GetElement(cssafter)
                )
                .then(function(p,c)
                {
                    if(!p)
                    {
                        Error.call(this,'_settings.appendto null or undefined.');
                        return;
                    }

                    if(!c)
                    {
                        Error.call(this,'_settings.csssettings.insertafter null or undefined.');
                        return;
                    }

                    _data.dialogparent  = $(p);
                    _data.cssafter      = $(c);
                    SetCSS();
                }, Error);
        }


        //-- Step 2, check and set dialog css
        function SetCSS()
        {
            var cssfile     = _settings.csssettings.file,
                cssafter    = _data.cssafter,
                cache       = _settings.cache;

            if($.inArray(cssfile, _globalself.csscache) < 0)
            {
                _globalself.csscache.push(cssfile);
                cssafter.after($(StringFormat('<link rel="styleSheet" type="text/css" href="{0}" />', cssfile)));
            }
            
            GetContent();
        }


        //-- Step 4, get content for dialog
        function GetContent()
        {
            var content = _settings.content;

            $.when( GetElement( content ))
                .then(function( obj )
                {
                    if(!obj)
                    {
                        Error.call(this,'_settings.content object null or undefined.');
                        return;
                    }

                    $.when(
                            GetElement( obj.header, ''),
                            GetElement( obj.body, ''),
                            GetElement( obj.footer, ''),
                            GetElement( obj.left, ''),
                            GetElement( obj.right, '')
                        )
                        .then(SetContent, Error);
                }, Error);
        }


        //-- set dialog content
        function SetContent( header, body, footer, left, right )
        {
            var parent      = _data.dialogparent,

                css         = _settings.css,
                fullsize    = _settings.fullsize,
                template    = _settings.template,
                
                uniqueid    = 'anotherdialog-tempid-' + Math.floor(0 + Math.random() * 1000000000),
                wrapholder  = formatPlaceHolder(5),
                holders     = [
                                    { n:'header',   h: formatPlaceHolder(0), e: $( (header)? StringFormat(template.header, header) : null )   },
                                    { n:'body',     h: formatPlaceHolder(1), e: $( StringFormat(template.body, (body || '')) )                },
                                    { n:'footer',   h: formatPlaceHolder(2), e: $( (footer)? StringFormat(template.footer, footer) : null )   },
                                    { n:'left',     h: formatPlaceHolder(3), e: $( (left)? StringFormat(template.left, left) : null )         },
                                    { n:'right',    h: formatPlaceHolder(4), e: $( (right)? StringFormat(template.right, right) : null )      }
                              ],
                wrap        = $( StringFormat(template.wrap, holders[0].h, holders[1].h, holders[2].h, holders[3].h, holders[4].h) ),
                complete    = $( StringFormat(template.complete, wrapholder) );

            complete.find('#'+uniqueid+'5').after(wrap).remove();
            
            $.each(holders, function(index, value) //-- find the temp elements and replace
            {   
                complete.find('#'+uniqueid+index).after( value.e ).remove();
                
                _data.dialog[value.n] = (value.e.length)? value.e.get(0) : null;  //-- set data for return
            });


            $.each(css, function(key, value) //-- apply custom css tweaks
            {
                if(value)
                {
                    if( fullsize )
                    {
                        holders[1].e.css(key, value);
                    }
                    else
                    {
                        wrap.css(key, value);
                    }
                }
            });

            _data.dialog.wrap = wrap.get(0);
            _data.dialog.complete = complete.get(0);
            
            if(_data.previous)
            {
                $(_data.previous).remove();
            }

            parent.append(complete);
            _data.previous = complete.get(0);

            _globalself.cache.push({ dialog:_data.dialog, settings:_settings });

            SetWindowEvent();

            _data.deferred.resolveWith( Context() ); //-- finalize the global deferred

            function formatPlaceHolder(index)
            {
                return StringFormat('<span id="{0}{1}" />', uniqueid, index);
            }
        }


        //-- Helper, set the window close event, activates on show
        function SetWindowEvent()
        {
            var dialog      = _data.dialog,
                windowclose = _settings.windowclose,
                fullsize    = _settings.fullsize;

            if(!windowclose)
            {
                return;
            }

            $( (fullsize)? $([dialog.body, dialog.header, dialog.footer]) : dialog.wrap ).on('click', function(event)
            {
                event.stopPropagation();
            });

            $(dialog.complete).on('click', function(event)
            {
                ShowHide(0);
            });
        }


        //-- Helper, global error
        function Error()
        {
            _data.deferred.rejectWith(this, arguments);
        }


        //-- Helper, get elements using jQuery Deferred
        function GetElement( element, alt )
        {
            var def = new $.Deferred(),
                ele = $.isFunction(element) ? element : function(){ return (element || alt || null); };

            $.when(ele.call(this)).then(def.resolve, def.reject);

            return def.promise();
        }


        //-- Helper, string format with tokens, see string.Format C#
        function StringFormat()
        {
            var args    = Array.prototype.slice.call(arguments, 0),
                string  = args.shift();

            for(var i=0; i<args.length; i++)
            {
                string = string.replace( new RegExp('\\{'+i+'\\}','g'), args[i]);
            }

            return string;
        }


        //-- Method Helper, show/hide the dialog
        function ShowHide( show )
        {
            var dialog      = _data.dialog,
                html        = _data.html,
                fullsize    = _settings.fullsize,
                cache       = _globalself.cache,
                classfull   = _settings.csssettings.classshowfull,
                classregular= _settings.csssettings.classshowregular,
                dialogclass = (fullsize)? _settings.csssettings.classshowfull : _settings.csssettings.classshowregular;

            html.removeClass(classfull+' '+classregular);

            _globalself.active = null;

            $.each(cache, function(i,v)
            {
                v.dialog.complete.style.display = 'none';
            });
            
            if(show)
            {
                _globalself.active = { dialog:dialog, settings:_settings };
                html.addClass(dialogclass);
                dialog.complete.style.display = 'block';
            }
        }


        //-- Helper, check if cache enabled
        function ReloadContent( show )
        {
            if(!show || _data.numbertimeson === 1 || _settings.cache) //-- if cache is disabled _data.numbertimeson should prevent reload of initial content
            {
                ShowHide.call(this, show);
                return;
            }

            _data.deferred = new $.Deferred();
            _data.promise = _data.deferred.promise();

            GetContent();

            _data.promise.done(function()
            {
                ShowHide.call(this, 1);
            });
        }


        //-- Method Helper, provide call/apply context
        function Context()
        {
            var fullsize    = _settings.fullsize,
                dialog      = _data.dialog;

            return {focus:((fullsize)? dialog.body : dialog.wrap), dialog:dialog, settings:_settings};
        }


        //-- Method Helper, deferred on complete/done 
        function CompletionDeferred(success, failure)
        {
            var self = this;

            if($.isFunction(success))
            {
                _data.promise.done(function()
                {
                    success.apply(Context(), arguments);
                });
            }

            if($.isFunction(failure))
            {
                _data.promise.fail(function()
                {
                    failure.apply(self, arguments);
                });
            }
        }


        //-- Method Helper, deferred show/hide
        function ShowHideDeferred(before, action, after)
        {
            var self    = this,
                def     = new $.Deferred();

            before = ($.isFunction(before))? before : function(){};
            action = ($.isFunction(action))? action : function(){};
            after = ($.isFunction(after))? after : function(){};

            _data.promise.done(function()
            {
                $.when( before.call(Context()) ).then(function()
                {
                    $.when( action.call(Context()) ).then(function()
                    {
                        $.when( after.call(Context()) ).then(function()
                        {
                            def.resolve(true);
                        });
                    });
                });
            });

            _data.promise = def.promise();
        }


        //-- Expose methods 
        AnotherDialog.prototype =
        {
            complete: function(success, failure)
            {
                CompletionDeferred.apply(this, arguments);
                return this;
            },

            show: function(before, after)
            {
                _data.numbertimeson += 1;
                ShowHideDeferred.call(this, before, function(){ ReloadContent.call(this, 1); }, after);
                return this;
            },

            hide: function(before, after)
            {
                ShowHideDeferred.call(this, before, function(){ ReloadContent.call(this, 0); }, after);
                return this;
            }
        };

        return new AnotherDialog();
    };


})(this, jQuery);