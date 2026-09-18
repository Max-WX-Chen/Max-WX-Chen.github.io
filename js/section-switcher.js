(function () {
  'use strict';

  var path = window.location.pathname;
  var isSelfSection = path.startsWith('/self-acceptance/');
  var isBlogSection = path.startsWith('/blog/');

  if (!isSelfSection && !isBlogSection) {
    return;
  }

  var isPost = Boolean(document.querySelector('article.post-content'));
  document.body.classList.add(
    'content-section',
    isSelfSection ? 'self-acceptance-section' : 'blog-section',
    isPost ? 'section-post' : 'section-index'
  );

  var favicon = document.querySelector('link[rel~="icon"]');
  if (favicon && isSelfSection) {
    favicon.href = '/img/penrose-favicon-self.svg';
    favicon.type = 'image/svg+xml';
  }

  if (window.CONFIG && isSelfSection) {
    window.CONFIG.search_path = '/self-acceptance/local-search.xml';
  }

  if (!isPost) {
    var subtitle = document.getElementById('subtitle');
    if (subtitle && isSelfSection) {
      subtitle.setAttribute('data-typed-text', '与自己和解');
      subtitle.textContent = '与自己和解';
      initSelfLibrary();
    }
    return;
  }

  var article = document.querySelector('article.post-content');
  var title = article && article.querySelector('#seo-header');
  var bannerMeta = document.querySelectorAll('#banner .post-meta');

  if (article && title && bannerMeta.length) {
    var metaRow = document.createElement('div');
    metaRow.className = 'reading-meta';
    bannerMeta.forEach(function (item) {
      metaRow.appendChild(item.cloneNode(true));
    });
    title.insertAdjacentElement('afterend', metaRow);
  }

  function initSelfLibrary() {
    var board = document.getElementById('board');
    var cards = board ? Array.from(board.querySelectorAll('.index-card')) : [];

    if (!board || !cards.length) {
      return;
    }

    var groups = new Map();
    cards.forEach(function (card) {
      var articleLink = card.querySelector('.index-header a');
      var categoryLink = card.querySelector('.category-chain-item');
      if (!articleLink) {
        return;
      }

      var category = categoryLink ? categoryLink.textContent.trim() : '随笔';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category).push({
        title: articleLink.textContent.trim(),
        url: articleLink.href
      });
    });

    var library = document.createElement('section');
    library.className = 'self-library';
    var sidebar = document.createElement('aside');
    sidebar.className = 'self-library-sidebar';
    sidebar.setAttribute('aria-label', '随笔目录');
    var sidebarTitle = document.createElement('div');
    sidebarTitle.className = 'self-library-title';
    sidebarTitle.textContent = '随笔目录';
    sidebar.appendChild(sidebarTitle);

    var reader = document.createElement('article');
    reader.className = 'self-library-reader is-welcome';
    reader.setAttribute('aria-live', 'polite');
    var welcome = document.createElement('div');
    welcome.className = 'self-library-welcome';
    var welcomeTitle = document.createElement('h2');
    welcomeTitle.textContent = '与自己和解';
    welcome.appendChild(welcomeTitle);
    reader.appendChild(welcome);

    groups.forEach(function (entries, category) {
      var group = document.createElement('div');
      group.className = 'self-folder is-open';
      var folderButton = document.createElement('button');
      folderButton.className = 'self-folder-button';
      folderButton.type = 'button';
      folderButton.setAttribute('aria-expanded', 'true');
      folderButton.innerHTML = '<i class="iconfont icon-category-fill" aria-hidden="true"></i><span></span><i class="iconfont icon-arrowdown" aria-hidden="true"></i>';
      folderButton.querySelector('span').textContent = category;

      var articleList = document.createElement('div');
      articleList.className = 'self-folder-articles';

      entries.forEach(function (entry) {
        var articleButton = document.createElement('button');
        articleButton.className = 'self-article-button';
        articleButton.type = 'button';
        articleButton.textContent = entry.title;
        articleButton.addEventListener('click', function () {
          loadArticle(entry, articleButton);
        });
        articleList.appendChild(articleButton);
      });

      folderButton.addEventListener('click', function () {
        var isOpen = group.classList.toggle('is-open');
        folderButton.setAttribute('aria-expanded', String(isOpen));
        articleList.hidden = !isOpen;
      });

      group.appendChild(folderButton);
      group.appendChild(articleList);
      sidebar.appendChild(group);
    });

    library.appendChild(sidebar);
    library.appendChild(reader);
    board.replaceChildren(library);

    function loadArticle(entry, button) {
      sidebar.querySelectorAll('.self-article-button').forEach(function (item) {
        item.classList.toggle('is-active', item === button);
      });
      reader.classList.add('is-loading');
      reader.classList.remove('is-welcome');
      reader.classList.add('has-article');
      reader.textContent = '正在读取...';
      reader.scrollTop = 0;

      fetch(entry.url)
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Article request failed');
          }
          return response.text();
        })
        .then(function (html) {
          var documentNode = new DOMParser().parseFromString(html, 'text/html');
          var content = documentNode.querySelector('.markdown-body');
          var metaItems = Array.from(documentNode.querySelectorAll('#banner .post-meta'))
            .map(function (item) { return item.textContent.trim(); })
            .filter(Boolean);

          var heading = document.createElement('h2');
          heading.textContent = entry.title;
          var meta = document.createElement('div');
          meta.className = 'self-reader-meta';
          meta.textContent = metaItems.join('   ');
          var body = document.createElement('div');
          body.className = 'markdown-body self-reader-body';
          body.innerHTML = content ? content.innerHTML : '<p>暂时无法读取这篇文章。</p>';

          reader.replaceChildren(heading, meta, body);
          reader.classList.remove('is-loading');
        })
        .catch(function () {
          reader.textContent = '文章读取失败，请稍后再试。';
          reader.classList.remove('is-loading');
        });
    }
  }
})();
