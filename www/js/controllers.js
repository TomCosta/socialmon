angular.module('socialmon.controllers', [])

.controller('LoginCtrl', function(store, $scope, $location, auth, $state) {
  function doAuth() {
    auth.signin({
      closable: false,
      // This asks for the refresh token
      // So that the user never has to log in again
      authParams: {
        scope: 'openid offline_access'
      }
    }, function(profile, idToken, accessToken, state, refreshToken) {
      store.set('profile', profile);
      store.set('token', idToken);
      store.set('refreshToken', refreshToken);
      $state.go('tab.dash');
    }, function(error) {
      console.log("There was an error logging in", error);
    });

  };

  $scope.$on('$ionic.reconnectScope', function() {
    doAuth();
  });

  doAuth();

})

.controller('DashCtrl', function($scope, auth, $state, Azureservice) {
  // replace with users activities

  $scope.shouldShowDelete = false;
  $scope.listCanSwipe = true;

  // $scope.$watch('mySMs', function() {

  // });

  // DONT FORGET TO INSERT USER INFOS TO DB HERE !!!
  function insertUserInfo() {

  };

  function queryUpcomingEvents() {

  };

  function queryMyEvents() {
    Azureservice.query('sm_events', {
      criteria: {
        event_creator: auth.profile.email
      },
      orderBy: [
        {
          column: 'event_date',
          direction: 'asc'
        },
        {
          column: 'event_starttime',
          direction: 'asc'
        }
      ]
    }).then(function(items) {
      $scope.mySMs = items;
    });
  };

  function initialize() {
    insertUserInfo();
    queryUpcomingEvents();
    queryMyEvents();
  };

  initialize();

  $scope.offset = new Date().getTimezoneOffset() * 60 * 1000;
  $scope.dateNowUTC = new Date().getTime();

  $scope.details = function(activityId) {
    $state.go('tab.dash-detail', {activityId: activityId});
  }

  // $scope.create = function() {
  //   $state.go('tab.create');
  // };
})

.controller('DashDetailCtrl', function($scope, $stateParams, Azureservice, $ionicLoading, $compile, $ionicPopup) {

  $scope.toggleGroupMap = function(group) {
    if ($scope.isGroupMapShown(group)) {
      $scope.shownGroupMap = null;
    } else {
      $scope.shownGroupMap = group;
    }
  };
  $scope.isGroupMapShown = function(group) {
    return $scope.shownGroupMap === group;
  };

  $scope.toggleGroupDetails = function(group) {
    if ($scope.isGroupDetailsShown(group)) {
      $scope.shownGroupDetails = null;
    } else {
      $scope.shownGroupDetails = group;
    }
  };
  $scope.isGroupDetailsShown = function(group) {
    return $scope.shownGroupDetails === group;
  };

  $scope.toggleGroupContact = function(group) {
    if ($scope.isGroupContactShown(group)) {
      $scope.shownGroupContact = null;
    } else {
      $scope.shownGroupContact = group;
    }
  };
  $scope.isGroupContactShown = function(group) {
    return $scope.shownGroupContact === group;
  };

  $scope.$on('$ionicView.enter', function() {
    Azureservice.getById('sm_events', $stateParams.activityId)
    .then(function(item) {
      $scope.activity = item;

      console.log($scope.activity.id);

        if (!($scope.activity.event_geocode === null))
        {
          var str_latlng = $scope.activity.event_geocode.replace("(","").replace(")","");
          var index_splitComma = str_latlng.indexOf(",");
          var lat = parseFloat(str_latlng.substring(0, index_splitComma));
          var lng = parseFloat(str_latlng.substring(index_splitComma + 2));

          console.log('str_latlng: ' + str_latlng);
          console.log('lat: ' + lat);
          console.log('lng: ' + lng);

          function initialize() {

            var  myLatlng = new google.maps.LatLng(lat,lng);
            console.log('myLatlng: ' + myLatlng);
            var mapOptions = {
              center: myLatlng,
              zoom: 16,
              mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            var map = new google.maps.Map(document.getElementById("map"),
                mapOptions);
            
            //Marker + infowindow + angularjs compiled ng-click
            var contentString = "<div><a ng-click='clickTest()'>" + $scope.activity.event_name + "</a></div>";
            var compiled = $compile(contentString)($scope);

            var infowindow = new google.maps.InfoWindow({
              content: compiled[0]
            });

            var marker = new google.maps.Marker({
              position: myLatlng,
              map: map,
              title: 'Uluru (Ayers Rock)'
            });

            google.maps.event.addListener(marker, 'click', function() {
              infowindow.open(map,marker);
            });

            $scope.map = map;
          }
          initialize();
        } else {
          document.getElementById("map").style.display = "none";
          $scope.shownGroupMap = null;
          var popupLocation = $ionicPopup.alert({
            title: 'Sorry',
            template: 'Socialmon could not find the location of this event :('
          })
        }
    }, function(err) {
      var popupError = $ionicPopup.alert({
        title: 'Sorry',
        template: 'Something wrong happened on our side :('
      })
      console.error('Azure getById: ' + err);
    });
  })

  $scope.centerOnMe = function() {
    if(!$scope.map) {
      return;
    }

    $scope.loading = $ionicLoading.show({
      content: 'Getting current location...',
      showBackdrop: false
    });

    navigator.geolocation.getCurrentPosition(function(pos) {
      $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
      $scope.loading.hide();
    }, function(error) {
      alert('Unable to get location: ' + error.message);
    });
  };
      
  $scope.clickTest = function() {
    alert('Example of infowindow with ng-click')
  };

  $scope.expandText = function() {
    var element = document.getElementById("txtcommcontent");
    element.style.height = element.scrollHeight + "px";
  };
})

.controller('CreateCtrl', function($scope, $ionicPopup, $cordovaDevice, $cordovaFile, $ionicPlatform, $ionicActionSheet, $cordovaCamera, $cordovaImagePicker, $timeout, $jrCrop, $ionicModal, Azureservice, auth) {
 
  $scope.selectedValue = "Party";
  $scope.selectedId = "1";
  $scope.cateList =[
    {name: "Party", id: "1"},
    {name: "Arena", id: "2"},
    {name: "Auto Show", id: "3"},
    {name: "Board/Card Game", id: "4"},
    {name: "Carnival", id: "5"},
    {name: "Camping", id: "6"},
    {name: "Club", id: "7"},
    {name: "Concert", id: "8"},
    {name: "Cosplay", id: "9"},
    {name: "Dating", id: "10"},
    {name: "Dessert", id: "11"},
    {name: "Dining", id: "12"},
    {name: "Exhibition", id: "13"},
    {name: "Fair", id: "14"},
    {name: "Game", id: "15"},
    {name: "High Tea", id: "16"},
    {name: "Ice-breaker", id: "17"},
    {name: "Meeting", id: "18"},
    {name: "Movie", id: "19"},
    {name: "Nightclub", id: "20"},
    {name: "Parade", id: "21"},
    {name: "Seminar", id: "22"},
    {name: "Speech", id: "23"},
    {name: "Shopping", id: "24"},
    {name: "Sport", id: "25"},
    {name: "Study", id: "26"},
    {name: "Travel", id: "27"},
    {name: "Not Found", id: "28"}
  ];

  $scope.timePickerObject = {
    inputEpochTime: new Date().getHours() * 60 * 60,  //Optional
    step: 15,  //Optional
    format: 12,  //Optional
    titleLabel: 'Event Start Time',  //Optional
    setLabel: 'Confirm',  //Optional
    closeLabel: 'Close',  //Optional
    setButtonType: 'button-assertive button-small',  //Optional
    closeButtonType: 'button-stable button-small',  //Optional
    callback: function (val) {
      timePickerCallback(val);
    }
  };

  function timePickerCallback(val) {
    if (typeof (val) === 'undefined') {
      console.log('Time not selected');
    } else {
      $scope.timePickerObject.inputEpochTime = val;
      var selectedTime = new Date(val * 1000);
      console.log('Selected epoch is : ' + val + ' and the time is ' + selectedTime.getUTCHours() + ':' + selectedTime.getUTCMinutes() + ' in UTC');
    }
  };

  var monthList = ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
  $scope.offset = new Date().getTimezoneOffset() * 60 * 1000;

  $scope.datepickerObject = {
    titleLabel: 'Event Date',  //Optional
    todayLabel: 'Today',  //Optional
    closeLabel: 'Close',  //Optional
    setLabel: 'Confirm',  //Optional
    setButtonType : 'button-assertive button-small',  //Optional
    todayButtonType : 'button-energized button-small',  //Optional
    closeButtonType : 'button-stable button-small',  //Optional
    inputDate: new Date( Date.now() - $scope.offset ),  //Optional
    mondayFirst: true,  //Optional
    monthList: monthList, //Optional
    templateType: 'popup', //Optional
    showTodayButton: 'true', //Optional
    modalHeaderColor: 'bar-stable', //Optional
    modalFooterColor: 'bar-stable', //Optional
    from: new Date( Date.now() - $scope.offset - 24*60*60*1000 ),
    to: new Date(2020, 0, 0),  //Optional
    callback: function (val) {  //Mandatory
      datePickerCallback(val);
    },
    dateFormat: 'dd-MM-yyyy', //Optional
    closeOnSelect: false, //Optional
  };
  
  $scope.dateNow = new Date($scope.datepickerObject.inputDate.getTime() + $scope.offset).getTime();

  function datePickerCallback(val) {
    if (typeof(val) === 'undefined') {
      console.log('No date selected');
    } else {
      $scope.datepickerObject.inputDate = val;
      console.log('Selected date is : ', val)
    }
  };

  // $scope.imageList = [];

  function takeCameraPicture() {
    var cam_options = {
      quality: 100,
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.CAMERA,
      allowEdit: true,
      encodingType: Camera.EncodingType.PNG,
      targetWidth: 300,
      targetHeight: 400,
      popoverOptions: CameraPopoverOptions,
      saveToPhotoAlbum: false,
      correctOrientation:true
    };
    $cordovaCamera.getPicture(cam_options)
      .then(function(cam_imageData) {
        var image_src = "data:image/png;base64," + cam_imageData;
        $scope.imageList.push(image_src);
      }, function(err) {
        console.log('CameraPicture failed: ' + err);
      });
  };

  function pickGalleryPicture() {
    var gallery_options = {
     maximumImagesCount: 3 - $scope.imageList.length,
     width: 300,
     height: 400,
     quality: 100
    };
    $cordovaImagePicker.getPictures(gallery_options)
      .then(function (results) {
        for (var i = 0; i < results.length; i++) {
          var img_url = results[i];
          convertImgToDataURLviaCanvas(img_url, function(base64Img){
            $scope.imageList.push(base64Img);
          });
        }
      }, function(error) {
        console.log('GalleryPicture: ' + err);
      });
  };

  function convertImgToDataURLviaCanvas(url, callback, outputFormat){
    var img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function(){
        var canvas = document.createElement('CANVAS');
        var ctx = canvas.getContext('2d');
        var dataURL;
        canvas.height = this.height;
        canvas.width = this.width;
        ctx.drawImage(this, 0, 0);
        dataURL = canvas.toDataURL(outputFormat);
        callback(dataURL);
        canvas = null; 
    };
    img.src = url;
  };

  $scope.addMedia = function() {
    var hideSheet = $ionicActionSheet.show({
      buttons: [
        { text: 'Take a Picture' },
        { text: 'Pick from Gallery' }
      ],
      titleText: 'Add a Picture',
      cancelText: 'Cancel',
      buttonClicked: function(index) {
        hideSheet();
        if ($scope.imageList.length < 3) {
          if (index === 0) {
            takeCameraPicture();
          } else {
            pickGalleryPicture();
          }
        } else {
          var popupPicLimit = $ionicPopup.alert({
            title: 'Cannot add more pictures',
            template: 'You may only add 3 pictures for your event!'
          });
        };
      }
    });
    $timeout(function() {
      hideSheet();
    }, 5000)
  };

  function cropImage(index) {
    $jrCrop.crop({
      url: $scope.imageList[index],
      width: 300,
      height: 100
    }).then(function(canvas) {
      var image_src = canvas.toDataURL('image/png');
      $scope.imageList[index] = image_src;
      console.log(image_src);
          // $ionicModal.fromTemplateUrl('result-cropped.html', function(modal) {
          //   console.log("in modal");
          //   $scope.modal = modal;
          //   modal.show().then(function() {
          //     document.querySelector('.cropped-canvas').appendChild(canvas);
          //   });
          // });
    });
  };

  function removeImage(index) {
    if (index > -1) {
      $scope.imageList.splice(index, 1);
    }
  };

  $scope.pictureOnClick = function(imgIndex) {
    var hideSheet = $ionicActionSheet.show({
      buttons: [
        { text: 'Crop to recommended size' },
        { text: 'Remove this picture' }
      ],
      titleText: 'Option',
      cancelText: 'Cancel',
      buttonClicked: function(index) {
        hideSheet();
        if (index === 0) {
          cropImage(imgIndex);
        } else {
          removeImage(imgIndex);
        }
      }
    });
    $timeout(function() {
      hideSheet();
    }, 8000)
  };

  $scope.expandText = function() {
    var element = document.getElementById("txtdesc");
    element.style.height = element.scrollHeight + "px";
  };

  $scope.submitForm = function(sm) {
    var mapPosition;
    function geocodeAddress(geocoder) {
      var address = sm.streetaddress + ", " + sm.city + " " + sm.postalcode;
      geocoder.geocode({'address': address}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          console.log('Geocode successful: ' + results[0].geometry.location);
          mapPosition = '' + results[0].geometry.location;
        } else {
          console.error('Geocode was not successful: ' + status);
        }
      });
    };
    var geocoder = new google.maps.Geocoder();
    geocodeAddress(geocoder);

    // function dataURItoBlob(dataURI) {
    //   // convert base64/URLEncoded data component to raw binary data held in a string
    //   var byteString;
    //   if (dataURI.split(',')[0].indexOf('base64') >= 0)
    //       byteString = atob(dataURI.split(',')[1]);
    //   else
    //       byteString = unescape(dataURI.split(',')[1]);

    //   // separate out the mime component
    //   var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    //   // write the bytes of the string to a typed array
    //   var ia = new Uint8Array(byteString.length);
    //   for (var i = 0; i < byteString.length; i++) {
    //       ia[i] = byteString.charCodeAt(i);
    //   }

    //   return new Blob([ia], {type:mimeString});
    // };
    var imageList_str;
    function getImageListString() {
      for (var i = 0; i < $scope.imageList.length; i++) {
        imageList_str += $scope.imageList[i];
        if (i < $scope.imageList.length - 1)
        {
          imageList_str += "|";
        }
      }
    };
    getImageListString();

    var confirmPopup = $ionicPopup.confirm({
      title: 'Warning',
      template: 'Once your Socialmon event is submitted, it cannot be edited. Continue?'
    });

    confirmPopup.then(function(res) {
      if(res) {
        var submitPopup = $ionicPopup.alert({
          title: 'Submit',
          template: 'Submitting ' + sm.eventname + '... This may take a few minutes.'
        });
        Azureservice.insert('sm_events', {
          event_name : sm.eventname,
          event_creator: auth.profile.email,
          event_sponsor: sm.sponsorname,
          event_date : new Date($scope.datepickerObject.inputDate.getTime() + $scope.offset).getTime(),
          event_starttime: $scope.timePickerObject.inputEpochTime * 1000 + $scope.offset,
          event_duration: sm.duration,
          event_streetaddress: sm.streetaddress,
          event_city: sm.city,
          event_postalcode: sm.postalcode,
          event_geocode: mapPosition,
          event_description: sm.desc,
          event_category: $scope.selectedValue,
          contact_name: sm.contactname,
          contact_email: sm.email,
          contact_phone: sm.tel,
          event_likes: 0,
          event_likedbyusers: '',
          event_userssignedup: '',
          event_usersconfirmed: '',
          event_reviews: 0,
          event_maxparticipants: sm.maxparticipants,
          event_currparticipants: 0,
          event_pictures: imageList_str
        }).then(function() {
          console.log('Insert successful');
          submitPopup.close();
          var popupSuccess = $ionicPopup.alert({
            title: 'Successful',
            template: 'Your Socialmon has been successfully registered!'
          })
        }, function(err) {
          console.error('Azure ' + err);
          submitPopup.close();
          var popupError = $ionicPopup.alert({
            title: 'Sorry',
            template: 'Something wrong happened on our side :('
          })
        });
      } else {
        console.log('Submit has been canceled');
      }
    })
  };
})

.controller('ActivitiesCtrl', function($scope, $q, $timeout, $ionicPopup, Azureservice, $ionicSideMenuDelegate, auth) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.offset = new Date().getTimezoneOffset() * 60 * 1000;
  $scope.dateUTCnumber = new Date().getTime();
  $scope.dateUTC = new Date($scope.dateUTCnumber);
  $scope.dateLocal = $scope.dateUTCnumber - $scope.offset;

  function initialize() {
    Azureservice.query('sm_events', {
      criteria: function(idontunderstandbutitworks) {
        return this.event_date >= (new Date().getTime());
      },
      orderBy: [
        {
          column: 'event_date',
          direction: 'asc'
        },
        {
          column: 'event_starttime',
          direction: 'asc'
        }
      ]
    }).then(function(items) {
      $scope.activities = items;
      for (var i = 0; i < $scope.activities.length; i++) {
        var act = $scope.activities[i];
        var pics = act.event_pictures.replace("undefined","").split("|");
        $scope.activities[i].event_pictures = pics;
        //console.log("activities.event_pictures: " + $scope.activities[i].event_pictures[0]);
      }
    });
  };
  initialize();

  $scope.doRefresh = function() {
    $timeout(function(){
      Azureservice.query('sm_events', {
        criteria: function(idontunderstandbutitworks) {
          return this.event_date >= (new Date().getTime());
        },
        orderBy: [
          {
            column: 'event_date',
            direction: 'asc'
          },
          {
            column: 'event_starttime',
            direction: 'asc'
          }
        ]
      }).then(function(items) {
        $scope.activities = items;
      });
      $scope.$broadcast("scroll.refreshComplete");
    }, 1000);
  };

  $scope.categories = function() {
    $ionicSideMenuDelegate.toggleLeft();
  };
  $scope.upvote = function(index) {
    var button = document.getElementById("upvote" + index);
    button.setAttribute('disabled', true);
    setTimeout(function() {
      button.removeAttribute('disabled');
    }, 3000);

    var activity = $scope.activities[index];
    var user_email = auth.profile.email;
    // get latest info of this activity
    Azureservice.getById('sm_events', activity.id)
      .then(function(item) {
        activity = item;
        var likedbyusers = activity.event_likedbyusers.split(",");
        var likedbythisuser_index = likedbyusers.indexOf(user_email); 

        function updateLikes() {
          if (likedbythisuser_index === -1) {
            likedbyusers.push(auth.profile.email);
            Azureservice.update('sm_events', {
              id: activity.id,
              event_likes: activity.event_likes,
              event_likedbyusers: likedbyusers.join()
            });
            $scope.activities[index].event_likes += 1;
          } else {
            likedbyusers.splice(likedbythisuser_index, 1);
            Azureservice.update('sm_events', {
              id: activity.id,
              event_likes: activity.event_likes,
              event_likedbyusers: likedbyusers.join()
            });
            $scope.activities[index].event_likes -= 1;
          }
        };

        updateLikes();

      }, function(err){
        console.error('Azure Upvote Error: ' + err);
      });
  };
/////////////////
    var usersSignedup = "";

    function getLatestEventInfo(index) {
      var deferred = $q.defer();

        Azureservice.getById('sm_events', $scope.activities[index].id)
          .then(function(item) {
              console.log('Query successful');
              $scope.activities[index] = item;
              if ($scope.activities[index].event_userssignedup.length === 0) {
                usersSignedup = "";
              } else {
                usersSignedup = $scope.activities[index].event_userssignedup;
              };
              deferred.resolve('getLatestEventInfo successful');
          }, function(err) {
              console.error('Azure Error: ' + err);
          });

      return deferred.promise;
    };

    function applytoEvent(index) {
      var deferred = $q.defer();

      if (usersSignedup.length > 0) {
        usersSignedup += ",";
      };
      usersSignedup += auth.profile.email;

      Azureservice.update('sm_events', {
        id: $scope.activities[index].id,
        event_userssignedup: usersSignedup
      })
      .then(function() {
        console.log('Update successful');
        deferred.resolve('applytoEvent successful');
      }, function(err) {
        console.error('Azure Error: ' + err);
      });

      return deferred.promise;
    };

    function checkApplied() {
      var deferred = $q.defer();

      if (usersSignedup.indexOf(auth.profile.email)) {
        var popupApplied = $ionicPopup.alert({
          title: 'Oops',
          template: 'It seems that you have already applied to join this event. Please wait patiently for event owner\'s approval.' 
        });
      } else {
        console.log('checkApplied successful');
        deferred.resolve('checkApplied successful');
      };

      return deferred.promise;
    };

  $scope.join = function(index) {
    getLatestEventInfo(index)
      .then(checkApplied)
      .then(applytoEvent(index))
      .then(function(result) {
        console.log(result);
        var popupResolved = $ionicPopup.alert({
          title: 'Application sent',
          template: 'Please wait for event owner\'s approval.'
        });
      }, function() {
        var popupRejected = $ionicPopup.alert({
          title: 'Sorry',
          template: 'Something wrong happened on our side :('
        });
      });
  };
})

.controller('ActivityDetailCtrl', function($scope, $stateParams, Azureservice, $ionicLoading, $compile, $ionicPopup) {

  $scope.toggleGroupMap = function(group) {
    if ($scope.isGroupMapShown(group)) {
      $scope.shownGroupMap = null;
    } else {
      $scope.shownGroupMap = group;
    }
  };
  $scope.isGroupMapShown = function(group) {
    return $scope.shownGroupMap === group;
  };

  $scope.toggleGroupDetails = function(group) {
    if ($scope.isGroupDetailsShown(group)) {
      $scope.shownGroupDetails = null;
    } else {
      $scope.shownGroupDetails = group;
    }
  };
  $scope.isGroupDetailsShown = function(group) {
    return $scope.shownGroupDetails === group;
  };

  $scope.toggleGroupContact = function(group) {
    if ($scope.isGroupContactShown(group)) {
      $scope.shownGroupContact = null;
    } else {
      $scope.shownGroupContact = group;
    }
  };
  $scope.isGroupContactShown = function(group) {
    return $scope.shownGroupContact === group;
  };

  $scope.$on('$ionicView.enter', function() {
    Azureservice.getById('sm_events', $stateParams.activityId)
    .then(function(item) {
      $scope.activity = item;

      console.log($scope.activity.id);

        if (!($scope.activity.event_geocode === null))
        {
          var str_latlng = $scope.activity.event_geocode.replace("(","").replace(")","");
          var index_splitComma = str_latlng.indexOf(",");
          var lat = parseFloat(str_latlng.substring(0, index_splitComma));
          var lng = parseFloat(str_latlng.substring(index_splitComma + 2));

          console.log('str_latlng: ' + str_latlng);
          console.log('lat: ' + lat);
          console.log('lng: ' + lng);

          function initialize() {

            var  myLatlng = new google.maps.LatLng(lat,lng);
            console.log('myLatlng: ' + myLatlng);
            var mapOptions = {
              center: myLatlng,
              zoom: 16,
              mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            var map = new google.maps.Map(document.getElementById("map"),
                mapOptions);
            
            //Marker + infowindow + angularjs compiled ng-click
            var contentString = "<div><a ng-click='clickTest()'>" + $scope.activity.event_name + "</a></div>";
            var compiled = $compile(contentString)($scope);

            var infowindow = new google.maps.InfoWindow({
              content: compiled[0]
            });

            var marker = new google.maps.Marker({
              position: myLatlng,
              map: map,
              title: 'Uluru (Ayers Rock)'
            });

            google.maps.event.addListener(marker, 'click', function() {
              infowindow.open(map,marker);
            });

            $scope.map = map;
          }
          initialize();
        } else {
          document.getElementById("map").style.display = "none";
          $scope.shownGroupMap = null;
          var popupLocation = $ionicPopup.alert({
            title: 'Sorry',
            template: 'Socialmon could not find the location of this event :('
          })
        }
    }, function(err) {
      var popupError = $ionicPopup.alert({
        title: 'Sorry',
        template: 'Something wrong happened on our side :('
      })
      console.error('Azure getById: ' + err);
    });
  })



  $scope.centerOnMe = function() {
    if(!$scope.map) {
      return;
    }

    $scope.loading = $ionicLoading.show({
      content: 'Getting current location...',
      showBackdrop: false
    });

    navigator.geolocation.getCurrentPosition(function(pos) {
      $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
      $scope.loading.hide();
    }, function(error) {
      alert('Unable to get location: ' + error.message);
    });
  };
      
  $scope.clickTest = function() {
    alert('Example of infowindow with ng-click')
  };
})

.controller('AccountCtrl', function($scope, auth, store, $state) {
  $scope.settings = {
    enableFriends: true
  };
  $scope.auth = auth;
  $scope.logout = function() {
    auth.signout();
    store.remove('token');
    store.remove('profile');
    store.remove('refreshToken');
    $state.go('login', {}, {reload: true});
  };
})

.controller('EditProfileCtrl', function($scope, auth) {
  $scope.auth = auth;
})

.directive('standardTimeMeridian', function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      etime: '=etime'
    },
    template: "<span>{{stime}}</span>",
    link: function(scope, elem, attrs) {

      scope.stime = epochParser(scope.etime, 'time');

      function prependZero(param) {
        if (String(param).length < 2) {
          return "0" + String(param);
        }
        return param;
      }

      function epochParser(val, opType) {
        if (val === null) {
          return "00:00";
        } else {
          var meridian = ['AM', 'PM'];

          if (opType === 'time') {
            var hours = parseInt(val / 3600);
            var minutes = (val / 60) % 60;
            var hoursRes = hours > 12 ? (hours - 12) : hours;

            var currentMeridian = meridian[parseInt(hours / 12)];

            return (prependZero(hoursRes) + ":" + prependZero(minutes) + " " + currentMeridian);
          }
        }
      }

      scope.$watch('etime', function(newValue, oldValue) {
        scope.stime = epochParser(scope.etime, 'time');
      });

    }
  };
});
