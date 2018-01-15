const fs = require('fs');
const $ = require('jquery');
const Datastore = require('nedb');
const electron = require('electron');

const img = require('./lib/modules/image');
const fileUtil = require('./lib/modules/fileUtil');
const tagManager = require('./lib/modules/search_tag_manager');

const BrowserWindow = electron.remote.BrowserWindow;
const imgDB = new Datastore({
  filename: 'db/images.db',
  autoload: true
});
const tagDB = new Datastore({
  filename: 'db/tag.db',
});
const multiImgDB = new Datastore({
  filename: 'db/multi_image.db',
  autoload:true
});

const DIR_ICON = './res/folder.svg';


$(() => {

  setMenuEvent();
  setAddDrectoryEvent();
  createTagList();
  setSearchEvent();

  updateThumb();

});

function setMenuEvent() {
  $('.menu').on('mouseover', () => {
    $('#menu-dropdown').addClass('is-active');
  });

  $('.menu').on('mouseleave', () => {
    $('#menu-dropdown').removeClass('is-active');
  });
}

function createTagList() {
  tagDB.loadDatabase();
  tagDB.find({}, (err, tags) => {
    let $tagList = $('#tag-list');
    $tagList.empty();
    if (tags) {
      tags.forEach((tag) => {
        $tagList.append(`<a class="dropdown-item" id="${tag._id}">${tag.name}</a>`);
        $('#' + tag._id).on('click', () => {
          tagManager.setSearchTag(tag);
          $('#search-input').val('');
          displayImageHavingTagIds(tagManager.getSearchTagIds());
          acriveTagList(tagManager.getSearchTag());
        });
      });
    }
  });
}

function findTagList(name) {
  $('#tag-list>a').addClass('is-hidden');
  $(`#tag-list>a:contains(${name})`).removeClass('is-hidden');
}

function setAddDrectoryEvent() {

  $('#open-add-directory').on('click', () => {
    $('#add-directory-modal').addClass('is-active');
    $('nav.navbar').addClass('is-hidden');
  });

  $('#add-directory-close').on('click', () => {
    $('#add-directory-modal').removeClass('is-active');
    $('nav.navbar').removeClass('is-hidden');
    $('#add-directory-result').empty();
  });

  $('#add-directory').on('click', () => {

    let path = $('#directory-path').val();
    let imageList = createImageList(path);

    imgDB.insert(imageList, (err, newImages) => {
      let newImagesNum = 0;
      let message = 'No image added.';

      if (newImages) {
        newImagesNum = newImages.length || 1;
        message = `${newImagesNum} new Image added.`;
      }

      $('#add-directory-result').empty().append(
        `<div class="notification">${message}</div>`
      );
      $('#img-list').empty();
      updateThumb();
    });

    $('#directory-path').val('');
  });
}

function setSearchEvent() {
  $('#search-input').on('focus', () => {
    $('#search-dropdown').addClass('is-active');
  });

  $('#search-input').on('blur', () => {
    // wait update value from dropdown
    setTimeout(() => {
      $('#search-dropdown').removeClass('is-active');
    }, 100);
  });

  $('#search-input').on('focus keyup', () => {
    let input = $('#search-input').val() || '';
    findTagList(input);
  });
}

function acriveTagList(tags) {
  $('#search-tags').empty();
  tags.forEach((tag) => {
    $('#search-tags').append(`
      <div class="control">
        <div class="tags has-addons">
            <a class="tag is-link">${tag.name}</a>
            <a class="tag is-delete" id="del-${tag._id}"></a>
        </div>
      </div>
    `);
    $('#del-'+tag._id).on('click',()=>{
      tagManager.removeSearchTagById(tag._id);
      displayImageHavingTagIds(tagManager.getSearchTagIds());
      acriveTagList(tagManager.getSearchTag());
    });
  });
}

function displayImageHavingTagIds(tagIds) {
  if (tagIds && tagIds.length > 0) {
    let classes = '';
    $('.image-thumb>a').hide();
    tagIds.forEach((tagId) => {
      classes += '.' + tagId;
    });
    $(classes).show();
  } else {
    $('.image-thumb>a').show();
  }
}

function updateThumb() {
  imgDB.loadDatabase();
  imgDB.find({}, (err, imgs) => {
    imgs.forEach((image) => {
      if (img.isImage(image.path)) {
        addThumb(image);
      }else{
        createDirIcon(image);
      }
    });
  });
}

function addThumb(image) {
  let name = fileUtil.path2File(image.path);
  let tags = image.tags || [];
  let tumbs = `<li class="image-thumb">
    <a target="_blank" id="${image._id}">
      <img src="${image.path}" title="${name}">
    </a>
  </li>`;
  $('#img-list').append(tumbs);
  $('#' + image._id).on('click', () => { windowOpen(image); });

  tags.forEach((tag) => {
    $('#' + image._id).addClass(tag);
  });

}

function createImageList(dir) {
  const files = fs.readdirSync(dir);

  const pathList = files.map((file) => {
    let path = `${dir.replace(/\\/g, '/')}/${file}`;
    return { path: path };
  });

  // remove undefined
  return pathList.filter((val) => {
    return val;
  });
}

function createDirIcon(image) {
  if (!image) return '';

  let dirName = fileUtil.path2File(image.path);
  let tags = image.tags || [];
  let imgIcon;
  let dirImage = img.firstImage(image.path);

  if (dirImage) {
    let imgSrc = `${image.path}/${dirImage}`;
    imgIcon = thumbDirIcon(imgSrc, dirName);
    let thumbs =  `<li class="dir-thumb">
    <a target="_blank" id="${image._id}">
      ${imgIcon}
    </a>
    </li>`;

    $('#img-list').append(thumbs);

    $('#' + image._id).on('click', () => { 
      //TODO dir view mode 
      //windowOpen(image); 
    });

    tags.forEach((tag) => {
      $('#' + image._id).addClass(tag);
    });
  }
}

function thumbDirIcon(img, dirName) {
  return `
  <img class="dir-thumb" src="${img}">
  <p><img class="icon" src="${DIR_ICON}">${dirName}</p>
  `;
}

function dirIcon(icon, dirName) {
  return `
  <img class="dir-thumb-img" src="${icon}">
  <p>${dirName}</p>
  `;
}

function windowOpen(image) {
  let { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;

  let viewerWindow = new BrowserWindow({
    left: 0,
    top: 0,
    width: width,
    height: height,
    useContentSize: true,
    frame: false
  });

  let param = $.param({
    path:image.path,
    id:image._id,
    tags:tagManager.getSearchTagIds()
  });

  viewerWindow.loadURL(`file://${__dirname}/viewer.html?${param}`);

  viewerWindow.on('closed', function () {
    viewerWindow = null;
    tagDB.loadDatabase();
    imgDB.loadDatabase();

    imgDB.findOne({ _id: image._id }, (err, newImage) => {
      if (newImage.tags) {
        $('#' + newImage._id).removeClass();
        newImage.tags.forEach((tag) => {
          $('#' + newImage._id).addClass(tag);
        });
      }
    });

    createTagList();
  });

  return false;
}