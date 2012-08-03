var ROOT = GetVirtualDirectory();

function GetVirtualDirectory() {
	var url = window.location.href;
	var url_parts = url.substr(0, url.indexOf('#')).split('/');
	url_parts[url_parts.length - 1] = '';
	var current_page_virtual_path = url_parts.join('/');
	return current_page_virtual_path;
}

$(function(){

	// Configure our data
   	_.each(lessonSlides, function(lesson){
		_.find(lessonData, function(l){ return l.id === lesson.id }).slides = lesson.slides;
	});
	_.each(lessonData, function(lesson){
		_.each(lesson.slides, function(slide){
			var theSlide = _.find(slideData, function(s){ return s.id === slide });
			if( !theSlide ) return;
			
			theSlide.lessons || (theSlide.lessons = []);
			theSlide.lessons.push({
				id: lesson.id,
				name: lesson.name
			});
		});
	}); 

	// All backbone below here
	var App = {};

	var HistoRouter = Backbone.Router.extend({
		
		routes: {
			"":					"showAll",
			"!/slide/:slide": 	"slide",
			"!/lesson/:lesson":	"lesson"
		},
		
		showAll: function(){
			if(App.AppView.lesson || App.AppView.query)
				App.AppView.showAllSlides();	
		},
		
		slide: function(slide){
			var valid = slide.match(/[a-zA-z]{1,2}-[0-9]{1,2}/);
			if(valid)
				App.AppView.setQuery(slide);
		},
		
		lesson: function(lesson){
			lesson = parseInt(lesson);
			App.AppView.showLesson(lesson);
		}
		
	});
	
	var Lesson = Backbone.Model.extend({
		
		defaults: {
			name: "Lesson",
			description: "",
			slides: [],
			fullView: false,
			visible: true
		},

	});
	
	var Slide = Backbone.Model.extend({
	
		defaults: {
			visible: true,
			checked: false	
		},
			
		initialize: function(){
			var links = {
				web: this.webLink(),
				desktop: this.imageScopeLink()
			};
			this.set({links: links});	
		},
	
		webLink: function(){
			return "http://digitalmicro.mc.vanderbilt.edu/ViewImage.php?&ImageId=" + this.get("imageId");
		},
		
		imageScopeLink: function(){
			return "http://digitalmicro.mc.vanderbilt.edu/ViewImage.php?&UseImageScope=1+&ImageId=" + this.get("imageId");
		},
		
		toggleChecked: function(){
			this.set({checked: !this.get('checked')});
		}
	
	});
	
	var Lessons = Backbone.Collection.extend({
		
		model: Lesson,
		
	});
	
	var Slides = Backbone.Collection.extend({
		
		model: Slide,
		
		query: function(q){
			var slideFormat = q.match(/[a-zA-z]{1,2}-[0-9]{1,2}/);
					
			return this.filter( function(slide){
				if( slideFormat )
					return slide.get('number').toLowerCase().indexOf(q) > -1;
				else
					return slide.get('description').toLowerCase().indexOf(q) > -1;
			});
		},
		
		getByLesson: function(id){
			return this.filter( function(slide){
				return _.any(slide.get('lessons'), function(lesson){
					return lesson.id == id;
				});
			});	
		},
		
		// sort on slide number
		comparator: function(slide){
			s = slide.get('number').split('-');
			n = s[1].length == 1 ? "0" + s[1] : s[1];
			return s[0] + n;
		}

	});
	
	var LessonView = Backbone.View.extend({
		
		className: "span3 boxed lesson",
		
		template: _.template($("#lesson-template").html()),
		
		events: {
			"click .show-slides a":		"showLessonSlides",
			"click .toggle-all-slides a":  "selectAllSlides"
		},
		
		initialize: function(){
			this.model.on('change:fullView', this.changeView, this);
			this.model.on('change:visible', this.toggleVisibility, this);
		},
		
		showLessonSlides: function(e){
			e.preventDefault();
			App.HistoRouter.navigate("#!/lesson/" + this.model.id, true);
		},
		
		render: function(){
			this.$el.html( this.template({ lesson: this.model.toJSON() }) );
			return this;
		},
		
		changeView: function(){
			if(this.model.get('fullView')){
				this.$el.removeClass('span3').addClass('span12');
			} else {
				this.$el.removeClass('span12').addClass('span3');
			}
			this.$el.find('.toggle').toggle();			
		},
		
		toggleVisibility: function(){
			this.$el.toggle();
		},
		
		selectAllSlides: function(e){
			e.preventDefault();
			var slides = App.Slides.getByLesson( this.model.id );
			_(slides).each( function(s){
				s.toggleChecked();
			});
		}	
		
	});
	
	var SlideView = Backbone.View.extend({
	
		className: "row-fluid slide",
		
		template: _.template($("#slide-template").html()),
		
		events: {
			"click .slide-check input":	"toggleChecked"
		},
		
		initialize: function(){		
			this.model.on('change:visible', this.toggleVisibility, this);
			this.model.on('change:checked', this.toggleCheckbox, this);
		},
		
		render: function(){
			this.$el.html( this.template({ init: App.Slides.indexOf(this.model) < 4, slide: this.model.toJSON() }) );
			this.cb = this.$el.find('.slide-check input');
			
			return this;
		},
		
		toggleChecked: function(){
			this.model.toggleChecked();
		},
		
		toggleVisibility: function(){
			this.$el.toggle();
		},
		
		toggleCheckbox: function(){
			if( this.model.get('checked') )
				this.cb.attr('checked',true);
			else
				this.cb.attr('checked',null);
		}
		
	});
	
	var AppView = Backbone.View.extend({
		
		el: 'body',
		
		events: {
			"keyup #q":		"querySlides",
			"click #scroll-top":	"scrollToTop",
			"click #clear-query":	"clearQuery",
			"click #clear-lesson":	"clearLesson",
			"click #bulk-slide-open a":	"bulkOpenSlides",
			"click #clear-checked":	"clearChecked"
		},
		
		initialize: function(){
			// Load in data
			App.Lessons = new Lessons(lessonData);
			App.Slides = new Slides(slideData);
			
			// Watch for changes in checked slides
			App.Slides.on('change:checked', this.updateBulkOpen, this);
		
			// Save cached jQuery refs
			this.search = $("#q");
			this.clearQueryButton = $("#clear-query");
			this.lessons = $("#lessons");
			this.lessonsContainer = $("#lessons-container");
			this.results = $("#results");
			
			// Create throttled query
			this.querySlides = _.throttle(this.executeQuery, 50);
			
			this.render();
		},
		
		render: function(){
			// First render lessons
			App.Lessons.each( function(lesson, ind){
    			var lessonView = new LessonView({model: lesson});
    			if( ind % 4 == 0 ){
					this.lessons.append('<div class="row-fluid" />');
				}
    			this.lessons.find(".row-fluid:last-child").append( lessonView.render().el );
    		}, this);
    		
    		// Next render slides
    		App.Slides.each( function(slide, ind){
    			var slideView = new SlideView({model: slide});
    			this.results.append( slideView.render().el );
    		}, this);
    		this.results.find("img").lazyload({
    			threshold: 200
    		});
		},
		
		scrollToTop: function(){
			$(document).scrollTop(0);
		},
		
		clearQuery: function(){
			if( this.search.val() != "" )	
				this.setQuery("");
		},
		
		setQuery: function(q){
			// Set the new query string
			this.search.val(q);
			// Focus the search form if needed
			if( ! this.search.is(':focus') )
				this.search.focus();
			// And run the query
			this.querySlides();
		},
		
		executeQuery: function(){
			var q = this.search.val().toLowerCase();
    			
			if( q.length == 0 ){
    			var matched = App.Slides.toArray();
    			this.clearQueryButton.hide();
    			this.lessonsContainer.show();
			} else if( q.length > 0 && q.length < 3 ){
				return; // do nothing
			} else {
    			var matched = App.Slides.query(q);
    			this.clearQueryButton.show();
				this.lessonsContainer.hide()	    			
			}
			
			this.toggleSlides( matched );			
		},
		
		showLesson: function(id){
			this.clearQuery();
			
			this.lesson = App.Lessons.get(id);
			
			$("#lesson-info").html( "<small>Lesson</small> " + this.lesson.get('name') + '<button id="clear-lesson" class="close">&times;</button>' ).show();
			this.updateNavPadding();
						
			this.lesson.set({ fullView: true, visible: true });
			App.Lessons.chain().without(this.lesson).each( function(l){
				l.set({ fullView: false, visible: false });
			});
			
			var matched = App.Slides.getByLesson(id);
			this.toggleSlides( matched );
		},
		
		clearLesson: function(){
			App.HistoRouter.navigate('', true);
		},
		
		toggleSlides: function(matched){
			// Hide the non-matching slides
			var rest = App.Slides.without( matched );
			_(rest).each( function(slide){
				slide.set({ visible: false });
			});
			// Now show the matches
			_(matched).each( function(slide){
				slide.set({ visible: true });
			});			
		},
		
		showAllSlides: function(){
			this.lesson = this.query = null;
			$("#lesson-info").empty().hide();
			this.updateNavPadding();
					
			App.Lessons.each( function(l){
				l.set({ fullView: false, visible: true });
			});
			
			this.toggleSlides( App.Slides.toArray() );			
		},
		
		updateBulkOpen: function(){
			var checked = App.Slides.where({checked: true});
			if( checked.length ){
				var word = checked.length > 1 ? " slides" : " slide";
				$("#bulk-slide-open").show().find(".slide-num").text( checked.length + word );
			} else {
				$("#bulk-slide-open").hide();
			}
			this.updateNavPadding();
		},
		
		bulkOpenSlides: function(e){
			e.preventDefault();
			var mode = $(e.target).attr('data-mode'),
				checked = App.Slides.where({checked: true});
			
			if(mode == "web"){
				_(checked).each( function(slide){
					window.open( slide.get('links').web );
				});
			} else if(mode == "desktop"){
				var ids = _(checked).map( function(slide){
					return "&ImageIds[]=" + slide.get('imageId');
				});
				window.open( "http://digitalmicro.mc.vanderbilt.edu/BulkAction.php?Command=BulkImageScopeView" + ids.join('') );
			}
		},
		
		clearChecked: function(){
			var slides = App.Slides.where({checked: true});
			_(slides).each( function(s){
				s.toggleChecked();
			});
		},
		
		updateNavPadding: function(){
			var off = $("nav").outerHeight() + 32;
			$('body').css('padding-top',off);
		}
		
	});

	// start app
	App.HistoRouter = new HistoRouter();
	App.AppView = new AppView();
	Backbone.history.start({pushState: false});
});