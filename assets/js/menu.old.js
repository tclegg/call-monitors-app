const {app} = require('electron').remote; 

window.navigation = window.navigation || {},
function(n) {
    navigation.menu = {
      constants: {
        sectionTemplate: '.section-template',
        contentContainer: '#wrapper',
        startSectionMenuItem: '#main-menu',
        startSection: '#main',
        footerContainer: '#footer',
        footerVersion: '.app-version'
      },

      importSectionsToDOM: function() {
        const links = document.querySelectorAll('link[rel="import"]')
        Array.prototype.forEach.call(links, function (link) {
          let template = link.import.querySelector(navigation.menu.constants.sectionTemplate)
          let clone = document.importNode(template.content, true)
          if ($(link).hasClass('footer-link')){
            document.querySelector(navigation.menu.constants.footerContainer).appendChild(clone)
            document.querySelector(navigation.menu.constants.footerVersion).innerHTML = 'v'+app.getVersion()
          } else {
            document.querySelector(navigation.menu.constants.contentContainer).appendChild(clone)
          }
        })
      },

      setMenuOnClickEvent: function () {
        document.body.addEventListener('click', function (event) {
          if (event.target.dataset.section) {
						//console.log(event.target.dataset.section)
            navigation.menu.hideAllSections()
            navigation.menu.showSection(event)
          }
        })
      },

      showSection: function(event) {
        const sectionId = event.target.dataset.section
        $('#' + sectionId).show()
        $('#' + sectionId + ' section').show()
      },

      showStartSection: function() {
        $(this.constants.startSectionMenuItem).click()
        $(this.constants.startSection).show()
        $(this.constants.startSection + ' section').show()
      },

      hideAllSections: function() {
        $(this.constants.contentContainer + ' section').hide()
				//console.log($(this.constants.contentContainer + ' section'));
      },

      init: function() {
        this.importSectionsToDOM()
				this.hideAllSections()
        this.setMenuOnClickEvent()
        this.showStartSection()
				$('ul.navbar-nav > li > a').click(function(){
					$('ul.navbar-nav > li').removeClass('active');
					//console.log($(this));
					$(this).parent().addClass('active');
				})
      }
    };

    n(function() {
        navigation.menu.init()
    })

}(jQuery);
