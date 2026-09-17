/* Terra Sud — scripts communs */
(function () {
  'use strict';

  /* En-tête : transparent sur le héro, fixe et sombre au défilement */
  var siteTop = document.querySelector('.site-top');
  if (siteTop) {
    var onScroll = function () {
      siteTop.classList.toggle('stuck', window.scrollY > 160);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Sélecteur de langue */
  var langSwitch = document.querySelector('.lang-switch');
  if (langSwitch) {
    var langBtn = langSwitch.querySelector('.lang-btn');
    var langLabel = langSwitch.querySelector('.lang-current');
    var options = langSwitch.querySelectorAll('.lang-menu button');

    var closeLang = function () {
      langSwitch.classList.remove('open');
      langBtn.setAttribute('aria-expanded', 'false');
    };

    langBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = langSwitch.classList.toggle('open');
      langBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    options.forEach(function (opt) {
      opt.addEventListener('click', function () {
        options.forEach(function (o) { o.classList.remove('is-current'); });
        opt.classList.add('is-current');
        langLabel.textContent = opt.textContent.trim();
        document.documentElement.lang = opt.dataset.lang;
        try { localStorage.setItem('terrasud-lang', opt.dataset.lang); } catch (err) {}
        closeLang();
        /* Quand les versions traduites existeront, remplacer par :
           window.location.href = '/' + opt.dataset.lang + '/'; */
      });
    });

    document.addEventListener('click', closeLang);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLang();
    });
    langSwitch.querySelector('.lang-menu').addEventListener('click', function (e) {
      e.stopPropagation();
    });

    try {
      var saved = localStorage.getItem('terrasud-lang');
      if (saved) {
        options.forEach(function (o) {
          if (o.dataset.lang === saved) {
            options.forEach(function (x) { x.classList.remove('is-current'); });
            o.classList.add('is-current');
            langLabel.textContent = o.textContent.trim();
          }
        });
      }
    } catch (err) {}
  }

  /* Menu mobile */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
      var open = nav.classList.contains('open');
      toggle.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* Bouton retour en haut */
  var toTop = document.querySelector('.to-top');
  if (toTop) {
    window.addEventListener('scroll', function () {
      toTop.classList.toggle('show', window.scrollY > 400);
    });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* Animations au défilement */
  var revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealables.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealables.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 90 + 'ms';
      io.observe(el);
    });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }

  /* Compteurs animés */
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var start = null;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / 1400, 1);
          el.textContent = Math.floor(p * target) + (el.dataset.suffix || '');
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        co.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* ------------------------------------------------------------------
     Moteur de recherche des circuits
     - accueil : le formulaire construit une URL vers le listing
     - listing : colonne de filtres, tri et affichage grille/liste, sans rechargement
     ------------------------------------------------------------------ */
  /* Trois axes comme sur terrasudadventures.com : la destination (géographie),
   l'activité (sous-famille commerciale : massif, désert, Rif…) et le type. */
  var FIELDS = ['dest', 'activite', 'type', 'duree', 'budget', 'niveau'];
  var searchForm = document.getElementById('tour-search');
  var results = document.getElementById('tour-results');

  /* form.elements[nom] gère aussi bien un <select> qu'un groupe de boutons radio */
  function readForm(form) {
    var c = {};
    FIELDS.forEach(function (k) {
      var f = form.elements[k];
      c[k] = f ? (f.value || '') : '';
    });
    return c;
  }

  function fillForm(form, c) {
    FIELDS.forEach(function (k) {
      var f = form.elements[k];
      if (f && c[k]) { try { f.value = c[k]; } catch (e) {} }
    });
  }

  function matchRange(value, range) {
    if (!range) return true;
    var parts = range.split('-');
    if (parts.length === 2) return value >= +parts[0] && value <= +parts[1];
    return value >= +parts[0];
  }

  function matchDuration(days, range) {
    if (!range) return true;
    if (range === '1') return days === 1;
    if (range === '8') return days >= 8;
    var p = range.split('-');
    return days >= +p[0] && days <= +p[1];
  }

  /* --- Accueil : redirection vers le listing --- */
  if (searchForm && searchForm.dataset.searchRedirect) {
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var c = readForm(searchForm);
      var q = FIELDS.filter(function (k) { return c[k]; })
        .map(function (k) { return k + '=' + encodeURIComponent(c[k]); }).join('&');
      window.location.href = searchForm.dataset.searchRedirect + (q ? '?' + q : '');
    });
  }

  /* --- Listing : filtrage, tri et affichage --- */
  if (searchForm && results && !searchForm.dataset.searchRedirect) {
    var cards = Array.prototype.slice.call(results.querySelectorAll('[data-dest]'));
    var order = cards.slice();
    var countEl = document.getElementById('tour-count');
    var emptyEl = document.getElementById('tour-empty');
    var chips = document.querySelectorAll('.chip[data-filter]');
    var pagination = document.querySelector('.pagination');
    var resetBtns = [document.getElementById('tour-reset'), document.getElementById('tour-reset-2'),
                     document.getElementById('filters-clear')];
    var sortSel = document.getElementById('tour-sort');
    var main = document.getElementById('listing-main');

    function apply(criteria, pushUrl) {
      var shown = 0;
      cards.forEach(function (card) {
        var ok =
          (!criteria.dest || card.dataset.dest === criteria.dest) &&
          (!criteria.type || card.dataset.category === criteria.type) &&
          (!criteria.activite || card.dataset.activite === criteria.activite) &&
          (!criteria.niveau || card.dataset.level === criteria.niveau) &&
          matchDuration(+card.dataset.days, criteria.duree) &&
          matchRange(+card.dataset.price, criteria.budget);
        card.hidden = !ok;
        if (ok) shown++;
      });

      if (countEl) countEl.textContent = shown;
      if (emptyEl) emptyEl.hidden = shown !== 0;
      chips.forEach(function (chip) {
        chip.classList.toggle('active', chip.dataset.filter === criteria.type);
      });

      var active = FIELDS.some(function (k) { return criteria[k]; });
      resetBtns.forEach(function (b) { if (b && b.id === 'tour-reset') b.hidden = !active; });
      if (pagination) pagination.hidden = active;

      if (pushUrl && window.history && window.history.replaceState) {
        var q = FIELDS.filter(function (k) { return criteria[k]; })
          .map(function (k) { return k + '=' + encodeURIComponent(criteria[k]); }).join('&');
        window.history.replaceState(null, '', q ? '?' + q : window.location.pathname);
      }
    }

    /* Tri : on réordonne les nœuds, le compteur N° se recalcule tout seul */
    function sortCards(mode) {
      var list = order.slice();
      if (mode === 'price-asc') list.sort(function (a, b) { return a.dataset.price - b.dataset.price; });
      else if (mode === 'price-desc') list.sort(function (a, b) { return b.dataset.price - a.dataset.price; });
      else if (mode === 'days-asc') list.sort(function (a, b) { return a.dataset.days - b.dataset.days; });
      else if (mode === 'days-desc') list.sort(function (a, b) { return b.dataset.days - a.dataset.days; });
      list.forEach(function (card) { results.appendChild(card); });
    }

    if (sortSel) {
      sortSel.addEventListener('change', function () { sortCards(sortSel.value); });
    }

    /* Grille ou liste */
    var views = document.querySelectorAll('.view[data-view]');
    views.forEach(function (btn) {
      btn.addEventListener('click', function () {
        views.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        if (main) main.classList.toggle('view-list', btn.dataset.view === 'list');
        try { localStorage.setItem('terrasud-view', btn.dataset.view); } catch (e) {}
      });
    });
    try {
      var savedView = localStorage.getItem('terrasud-view');
      if (savedView === 'list') {
        var listBtn = document.querySelector('.view[data-view="list"]');
        if (listBtn) listBtn.click();
      }
    } catch (e) {}

    /* Critères venus de l'URL */
    var params = new URLSearchParams(window.location.search);
    var initial = {};
    FIELDS.forEach(function (k) { initial[k] = params.get(k) || ''; });
    fillForm(searchForm, initial);
    apply(initial, false);

    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      apply(readForm(searchForm), true);
      if (main) main.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    /* Chaque coche applique le filtre immédiatement */
    searchForm.addEventListener('change', function (e) {
      if (e.target && e.target.type === 'radio') apply(readForm(searchForm), true);
    });

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = searchForm.elements.type;
        if (f) f.value = chip.dataset.filter;
        apply(readForm(searchForm), true);
      });
    });

    resetBtns.forEach(function (btn) {
      if (!btn) return;
      btn.addEventListener('click', function () {
        searchForm.reset();
        var empty = {};
        FIELDS.forEach(function (k) { empty[k] = ''; });
        apply(empty, true);
      });
    });
  }

  /* Mobile : repli de la colonne de filtres */
  var filtersToggle = document.getElementById('filters-toggle');
  if (filtersToggle) {
    var filtersCol = filtersToggle.closest('.filters');
    filtersToggle.addEventListener('click', function () {
      var open = filtersCol.classList.toggle('open');
      filtersToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      filtersToggle.querySelector('span').textContent = open ? 'Fermer' : 'Ouvrir';
    });
  }

  /* ------------------------------------------------------------------ *
   * Sommaire de la fiche circuit
   * Les cinq sections s'enchaînent ; la barre indique celle qu'on lit et y
   * conduit au clic. Le repérage se fait à l'IntersectionObserver plutôt qu'en
   * mesurant à chaque image du défilement : le navigateur fait le travail.
   * ------------------------------------------------------------------ */
  var tabsRoot = document.getElementById('trip-tabs');
  if (tabsRoot) {
    var liens = Array.prototype.slice.call(tabsRoot.querySelectorAll('.tabs-nav .tab'));
    var nav = tabsRoot.querySelector('.tabs-nav');
    var sections = liens
      .map(function (a) { return document.querySelector(a.getAttribute('href')); })
      .filter(Boolean);

    function marque(id) {
      liens.forEach(function (a) {
        var actif = a.getAttribute('href') === '#' + id;
        a.classList.toggle('active', actif);
        if (actif) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
        /* Sur mobile la barre défile : la section lue doit rester en vue. */
        if (actif && nav.scrollWidth > nav.clientWidth) {
          a.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
        }
      });
    }

    if ('IntersectionObserver' in window && sections.length) {
      /* La bande de lecture : juste sous la barre collée, et haute d'un tiers
         d'écran. La section qui l'occupe est celle qu'on est en train de lire. */
      function bande() {
        var h = parseFloat(getComputedStyle(nav).top) || 0;
        h += nav.getBoundingClientRect().height;
        return '-' + Math.round(h + 8) + 'px 0px -' + Math.round(window.innerHeight * 0.62) + 'px 0px';
      }
      var vues = new Set();
      var obs = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (e) {
          if (e.isIntersecting) vues.add(e.target.id); else vues.delete(e.target.id);
        });
        /* Plusieurs sections peuvent occuper la bande : on retient la première
           dans l'ordre du document, celle dont on lit le début. */
        for (var i = 0; i < sections.length; i++) {
          if (vues.has(sections[i].id)) { marque(sections[i].id); return; }
        }
      }, { rootMargin: bande(), threshold: 0 });
      sections.forEach(function (sec) { obs.observe(sec); });
    }

    /* La barre se colle sous l'en-tête dès que son emplacement d'origine sort
       de l'écran. Une sentinelle posée juste au-dessus le signale : c'est plus
       sûr que de comparer des coordonnées à chaque image du défilement. */
    if (nav && 'IntersectionObserver' in window) {
      var temoin = document.createElement('div');
      temoin.className = 'tabs-temoin';
      temoin.setAttribute('aria-hidden', 'true');
      nav.parentNode.insertBefore(temoin, nav);
      new IntersectionObserver(function (entrees) {
        var e = entrees[0];
        /* Collée seulement quand la sentinelle est passée AU-DESSUS de la ligne
           de collage ; tant qu'elle est en dessous, la barre n'est pas encore
           atteinte et ne doit porter ni ombre ni débord. rootBounds tient
           compte du rootMargin : c'est la bonne référence, pas le zéro. */
        var ligne = e.rootBounds ? e.rootBounds.top : 0;
        nav.classList.toggle('est-collee',
          !e.isIntersecting && e.boundingClientRect.top < ligne);
      }, { threshold: 0, rootMargin: '-' + (parseFloat(getComputedStyle(nav).top) || 0) + 'px 0px 0px 0px' })
        .observe(temoin);
    }
  }

  /* Formulaires de démonstration */
})();

/* ------------------------------------------------------------------ *
 * Héro : sous 767 px, la recherche se replie derrière un seul bouton.
 * Quatre listes déroulantes empilées feraient un héro de deux écrans.
 * ------------------------------------------------------------------ */
(function () {
  var toggle = document.querySelector('.search-toggle');
  var form = document.getElementById('tour-search');
  if (!toggle || !form) return;
  toggle.addEventListener('click', function () {
    var open = form.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.classList.toggle('is-open', open);
    if (open) {
      var first = form.querySelector('select, input');
      if (first) first.focus({ preventScroll: true });
    }
  });
})();

/* ==========================================================================
 * Formulaires — validation, états et envoi
 * --------------------------------------------------------------------------
 * Tant qu'aucun backend n'existe, MODE_DEMO reste à true : le formulaire est
 * validé, les états s'affichent, mais rien n'est envoyé. Le jour où les points
 * d'entrée (/api/…) répondent, passez MODE_DEMO à false : le reste ne bouge pas.
 * ========================================================================== */
(function () {
  var MODE_DEMO = true;

  var MESSAGES = {
    vide:    'Ce champ est obligatoire',
    email:   'Adresse e-mail invalide',
    tel:     'Numéro de téléphone invalide',
    date:    'Choisissez une date à venir',
    nombre:  'Indiquez au moins un voyageur',
    court:   'Merci de détailler un peu plus'
  };

  function messageDe(champ) {
    var v = (champ.value || '').trim();
    if (champ.required && !v) return MESSAGES.vide;
    if (!v) return null;
    if (champ.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return MESSAGES.email;
    if (champ.type === 'tel' && v.replace(/[^\d]/g, '').length < 8) return MESSAGES.tel;
    if (champ.type === 'date' && v < new Date().toISOString().slice(0, 10)) return MESSAGES.date;
    if (champ.type === 'number' && +v < 1) return MESSAGES.nombre;
    if (champ.tagName === 'TEXTAREA' && v.length < 10) return MESSAGES.court;
    return null;
  }

  function marquer(champ, message) {
    var bloc = champ.closest('.field') || champ.parentElement;
    var note = bloc.querySelector('.field-error');
    if (message) {
      bloc.classList.add('is-error');
      champ.setAttribute('aria-invalid', 'true');
      if (!note) {
        note = document.createElement('span');
        note.className = 'field-error';
        bloc.appendChild(note);
      }
      note.textContent = message;
    } else {
      bloc.classList.remove('is-error');
      champ.removeAttribute('aria-invalid');
      if (note) note.remove();
    }
    return !message;
  }

  function retour(form, type, texte) {
    var note = form.querySelector('.form-note');
    if (!note) {
      note = document.createElement('p');
      note.setAttribute('role', 'status');
      form.appendChild(note);
    }
    var icone = type === 'ok' ? 'fa-circle-check' : type === 'ko' ? 'fa-circle-exclamation' : 'fa-circle-info';
    note.className = 'form-note form-note--' + type;
    note.innerHTML = '<i class="fa-solid ' + icone + '"></i><span></span>';
    note.querySelector('span').textContent = texte;
    return note;
  }

  document.querySelectorAll('form[data-form]').forEach(function (form) {
    var champs = Array.prototype.slice.call(
      form.querySelectorAll('input:not([type=hidden]), select, textarea')
    ).filter(function (c) { return !c.closest('.hp'); });

    /* On ne signale une erreur qu'après une première tentative : signaler
       pendant la frappe est hostile. Ensuite, la correction est immédiate. */
    var tenté = false;
    champs.forEach(function (c) {
      c.addEventListener('input', function () { if (tenté) marquer(c, messageDe(c)); });
      c.addEventListener('blur', function () { if (tenté) marquer(c, messageDe(c)); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      tenté = true;

      var premierFautif = null;
      champs.forEach(function (c) {
        var msg = messageDe(c);
        if (!marquer(c, msg) && !premierFautif) premierFautif = c;
      });
      if (premierFautif) {
        retour(form, 'ko', 'Quelques champs demandent votre attention.');
        premierFautif.focus({ preventScroll: true });
        premierFautif.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }

      /* Piège à robots : rempli = on fait semblant d'accepter, sans rien envoyer. */
      var piege = form.querySelector('.hp input');
      if (piege && piege.value) { retour(form, 'ok', 'Merci, votre message a été transmis.'); return; }

      var bouton = form.querySelector('[type=submit]');
      if (bouton) bouton.classList.add('is-loading');

      if (MODE_DEMO) {
        setTimeout(function () {
          if (bouton) bouton.classList.remove('is-loading');
          retour(form, 'demo',
            'Formulaire valide. Aucun envoi : le point d’entrée ' +
            form.getAttribute('action') + ' n’est pas encore branché.');
          form.reset();
        }, 700);
        return;
      }

      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r); })
        .then(function (data) {
          if (data && data.redirect) { window.location.href = data.redirect; return; }
          if (bouton) bouton.classList.remove('is-loading');
          retour(form, 'ok', (data && data.message) || 'Merci, votre demande a bien été transmise.');
          form.reset();
        })
        .catch(function (r) {
          if (bouton) bouton.classList.remove('is-loading');
          /* 422 : le serveur renvoie { erreurs: { champ: "message" } } */
          if (r && r.status === 422 && r.json) {
            r.json().then(function (data) {
              Object.keys(data.erreurs || {}).forEach(function (nom) {
                var c = form.querySelector('[name="' + nom + '"]');
                if (c) marquer(c, data.erreurs[nom]);
              });
              retour(form, 'ko', 'Quelques champs demandent votre attention.');
            });
          } else {
            retour(form, 'ko', 'L’envoi a échoué. Réessayez, ou écrivez-nous à contact@terrasudadventures.com.');
          }
        });
    });
  });

  /* Page de confirmation : renseigne la référence depuis l'URL (?ref=…&sujet=…) */
  var confirmation = document.querySelector('.confirm-ref');
  if (confirmation) {
    var p = new URLSearchParams(location.search);
    var SUJETS = { reservation:'Demande de réservation', 'demande-devis':'Demande de devis',
                   'question-circuit':'Question sur un circuit', newsletter:'Inscription à la lettre' };
    var ref = p.get('ref') || 'TS-' + new Date().getFullYear() + '-' +
              String(Math.floor(Math.random() * 9000) + 1000);
    var set = function (k, v) {
      var el = confirmation.querySelector('[data-champ="' + k + '"]');
      if (el) el.textContent = v;
    };
    set('reference', ref);
    set('date', new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' }));
    set('sujet', SUJETS[p.get('sujet')] || 'Demande d’information');
  }
})();

/* ==========================================================================
 * Parcours de réservation
 * --------------------------------------------------------------------------
 * Aucun tarif n'est écrit ici : tout vient du HTML (data-prix, data-tarif,
 * data-unite, data-part). Un backend qui rend cette page n'a qu'à produire
 * ces attributs, le calcul suit.
 * ========================================================================== */
(function () {
  var form = document.getElementById('reservation');
  if (!form) return;

  var etapes  = Array.prototype.slice.call(form.querySelectorAll('.etape'));
  var puces   = Array.prototype.slice.call(document.querySelectorAll('.stepper li'));
  var annonce = document.getElementById('annonce-etape');
  var prec    = form.querySelector('[data-nav="prec"]');
  var suiv    = form.querySelector('[data-nav="suiv"]');
  var envoyer = form.querySelector('[data-nav="envoyer"]');
  var courant = 0;

  var euro = function (n) {
    return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €';
  };
  var lit = function (sel, attr) {
    var el = form.querySelector(sel);
    return el ? parseFloat(el.getAttribute(attr)) || 0 : 0;
  };

  /* ---------------------------------------------------------------- calcul */
  function etat() {
    var choisi = form.querySelector('input[name="depart"]:checked');
    var base   = choisi ? +choisi.dataset.prix : 0;
    var lignes = [];
    var total  = 0;
    var tetes  = 0;

    form.querySelectorAll('.pax-row').forEach(function (row) {
      var champ = row.querySelector('input[type=number]');
      var n = +champ.value;
      var coef = parseFloat(row.dataset.tarif);
      var pu = Math.round(base * coef);
      var cellule = row.querySelector('[data-prix-de]');
      if (cellule) cellule.textContent = base ? euro(pu) + ' / pers.' : '—';
      if (n > 0) {
        tetes += (coef > 0 ? n : 0);       /* les bébés ne comptent pas comme payants */
        if (pu > 0) {
          total += pu * n;
          lignes.push({ nom: n + ' × ' + row.querySelector('strong').textContent.toLowerCase(),
                        val: pu * n });
        } else if (base) {
          lignes.push({ nom: n + ' × ' + row.querySelector('strong').textContent.toLowerCase(),
                        val: 0 });
        }
      }
      /* bornes du compteur */
      row.querySelectorAll('.compteur button').forEach(function (b) {
        var vise = +champ.value + (+b.dataset.pas);
        b.disabled = vise < +champ.min || vise > +champ.max;
      });
    });

    form.querySelectorAll('.extra input:checked').forEach(function (opt) {
      var pu = +opt.dataset.prix;
      var m  = opt.dataset.unite === 'personne' ? pu * Math.max(tetes, 1) : pu;
      total += m;
      lignes.push({ nom: opt.closest('.extra').querySelector('strong').textContent,
                    val: m, option: true });
    });

    return { choisi: choisi, base: base, total: total, lignes: lignes, tetes: tetes };
  }

  function recapitule() {
    var e = etat();

    var d = form.querySelector('[data-recap="depart"]');
    if (d) d.textContent = e.choisi ? e.choisi.dataset.libelle : 'À choisir';

    var libellés = [];
    form.querySelectorAll('.pax-row').forEach(function (row) {
      var n = +row.querySelector('input[type=number]').value;
      if (!n) return;
      var mot = row.querySelector('strong').textContent.toLowerCase();
      libellés.push(n + ' ' + (n > 1 ? mot : mot.replace(/s$/, '')));
    });
    var p = form.querySelector('[data-recap="pax"]');
    if (p) p.textContent = libellés.join(', ') || '—';

    var liste = form.querySelector('[data-recap="detail"]');
    if (liste) {
      liste.innerHTML = '';
      e.lignes.forEach(function (l) {
        var li = document.createElement('li');
        if (l.option) li.className = 'est-option';
        li.innerHTML = '<span></span><span></span>';
        li.children[0].textContent = l.nom;
        li.children[1].textContent = l.val ? euro(l.val) : 'offert';
        liste.appendChild(li);
      });
    }

    var t = form.querySelector('[data-recap="total"]');
    if (t) t.textContent = e.total ? euro(e.total) : '—';

    var part = form.querySelector('input[name="reglement"]:checked');
    var coef = part ? parseFloat(part.dataset.part) : 0.3;
    var a = form.querySelector('[data-recap="acompte"]');
    if (a) a.textContent = e.total ? euro(Math.round(e.total * coef)) : '—';

    var mA = form.querySelector('[data-montant="acompte"]');
    var mT = form.querySelector('[data-montant="total"]');
    if (mA) mA.textContent = e.total ? euro(Math.round(e.total * 0.3)) : '—';
    if (mT) mT.textContent = e.total ? euro(e.total) : '—';
  }

  /* -------------------------------------------------------- participants */
  function participants() {
    var zone = document.getElementById('participants');
    if (!zone) return;
    var n = 0;
    form.querySelectorAll('.pax-row input[type=number]').forEach(function (c) { n += +c.value; });
    n = Math.min(n, 12);
    var actuels = zone.querySelectorAll('.participant').length;
    if (actuels === n) return;
    zone.innerHTML = '';
    for (var i = 1; i <= n; i++) {
      var f = document.createElement('fieldset');
      f.className = 'participant';
      f.innerHTML =
        '<legend>Participant ' + i + '</legend>' +
        '<div class="row g-2">' +
        '<div class="field"><label for="p' + i + '-nom">Nom et prénom</label>' +
        '<input id="p' + i + '-nom" name="participant[' + i + '][nom]" type="text"></div>' +
        '<div class="field"><label for="p' + i + '-naissance">Date de naissance</label>' +
        '<input id="p' + i + '-naissance" name="participant[' + i + '][naissance]" type="date"></div>' +
        '</div>';
      zone.appendChild(f);
    }
  }

  /* ---------------------------------------------------------- navigation */
  function valide(i) {
    if (i === 0 && !form.querySelector('input[name="depart"]:checked')) {
      alertEtape('Choisissez d’abord une date de départ.');
      return false;
    }
    var manquants = [];
    etapes[i].querySelectorAll('[required]').forEach(function (c) {
      var vide = c.type === 'checkbox' ? !c.checked : !c.value.trim();
      var bloc = c.closest('.field') || c.parentElement;
      bloc.classList.toggle('is-error', vide);
      if (vide) manquants.push(c);
    });
    if (manquants.length) {
      alertEtape('Quelques champs demandent votre attention.');
      manquants[0].focus({ preventScroll: true });
      return false;
    }
    var note = etapes[i].querySelector('.etape-alerte');
    if (note) note.remove();
    return true;
  }

  function alertEtape(texte) {
    var sec = etapes[courant];
    var note = sec.querySelector('.etape-alerte');
    if (!note) {
      note = document.createElement('p');
      note.className = 'form-note form-note--ko etape-alerte';
      note.setAttribute('role', 'alert');
      sec.appendChild(note);
    }
    note.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i><span></span>';
    note.querySelector('span').textContent = texte;
  }

  function montre(i) {
    courant = Math.max(0, Math.min(i, etapes.length - 1));
    etapes.forEach(function (s, k) {
      s.hidden = k !== courant;
      s.classList.toggle('is-current', k === courant);
    });
    puces.forEach(function (li, k) {
      li.classList.toggle('is-current', k === courant);
      li.classList.toggle('is-done', k < courant);
      /* aria-current situe l'utilisateur ; un bouton d'étape franchie redevient
         actionnable, les étapes à venir restent désactivées. */
      if (k === courant) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
      var b = li.querySelector('button');
      if (b) b.disabled = k > courant;
    });
    if (annonce) {
      var titre = etapes[courant].querySelector('.sec-title');
      annonce.textContent = 'Étape ' + (courant + 1) + ' sur ' + etapes.length +
                            (titre ? ' — ' + titre.textContent : '');
    }
    prec.hidden = courant === 0;
    suiv.hidden = courant === etapes.length - 1;
    envoyer.hidden = courant !== etapes.length - 1;
    if (courant === 2) participants();
    var haut = document.querySelector('.booking-page');
    if (haut) window.scrollTo({ top: haut.offsetTop - 90, behavior: 'smooth' });
    /* Le focus suit l'étape, sinon la navigation au clavier reste en bas de page. */
    var cible = etapes[courant].querySelector('.sec-title');
    if (cible) { cible.setAttribute('tabindex', '-1'); cible.focus({ preventScroll: true }); }
  }

  suiv.addEventListener('click', function () { if (valide(courant)) montre(courant + 1); });
  prec.addEventListener('click', function () { montre(courant - 1); });
  puces.forEach(function (li, k) {
    var b = li.querySelector('button') || li;
    b.addEventListener('click', function () { if (k < courant) montre(k); });
  });

  /* -------------------------------------------------------------- écoutes */
  form.querySelectorAll('.compteur button').forEach(function (b) {
    b.addEventListener('click', function () {
      var champ = b.parentElement.querySelector('input');
      var v = +champ.value + (+b.dataset.pas);
      champ.value = Math.max(+champ.min, Math.min(+champ.max, v));
      recapitule();
    });
  });
  form.addEventListener('change', function (e) {
    if (e.target.matches('input[name="depart"], .extra input, input[name="reglement"]')) recapitule();
  });

  recapitule();
  montre(0);
})();

/* ==========================================================================
   LISTES DÉROULANTES — la liste du système remplacée par la nôtre
   --------------------------------------------------------------------------
   Un <select> se compose de deux parties : le champ fermé, que la CSS peut
   habiller, et la liste ouverte, que le système d'exploitation dessine seul —
   aucune propriété CSS ne l'atteint. Pour la mettre à la charte, il faut donc
   la redessiner.

   Le parti pris ici : NE PAS remplacer le <select>. Il reste le contrôle —
   il garde son étiquette, son ordre de tabulation, son état d'erreur, sa
   valeur, et c'est lui que lit le moteur de recherche de ce site. On
   n'intercepte que l'ouverture de la liste native, pour afficher la nôtre à
   la place et tenir les deux synchronisées. Si l'interception échoue sur un
   navigateur, la liste du système s'ouvre : moins jolie, parfaitement
   fonctionnelle.

   Au-delà de SEUIL_RECHERCHE options, le panneau s'ouvre avec un champ de
   recherche : dix-neuf destinations ne se parcourent pas à l'œil. En deçà, le
   champ serait du bruit — quatre durées se lisent d'un coup.

   Sur un écran tactile, rien n'est remplacé : la roue d'iOS et la feuille
   d'Android se manient à un pouce, mieux que n'importe quel panneau maison.
   ========================================================================== */
(function () {
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;

  var PANNEAU_MAX = 320;       // hauteur maximale de la liste, en pixels
  var SEUIL_RECHERCHE = 8;     // à partir de combien d'options on ajoute le champ
  var compteur = 0;
  var ouvert = null;           // { select, panneau, opts, actif, indexDepart, champ }

  /* Comparaison sans accents ni casse : « vallee » doit trouver « Vallée ». */
  function aplat(t) {
    return t.normalize ? t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
                       : t.toLowerCase();
  }

  /* ---------- construction ---------- */

  function construit(select) {
    var n = ++compteur;
    var p = document.createElement('div');
    p.className = 'selectx-panel';
    if (select.closest('.hero')) p.className += ' selectx-panel--ink';

    var nom = '';
    var lab = select.id && document.querySelector('label[for="' + select.id + '"]');
    if (!lab && select.closest('label')) lab = select.closest('label');
    if (lab) nom = lab.textContent.trim();

    var ul = document.createElement('ul');
    ul.className = 'selectx-list';
    ul.id = 'selectx-liste-' + n;
    ul.setAttribute('role', 'listbox');
    if (nom) ul.setAttribute('aria-label', nom);

    Array.prototype.forEach.call(select.options, function (o, i) {
      var li = document.createElement('li');
      li.className = 'selectx-opt' + (o.disabled ? ' est-inactif' : '');
      li.id = 'selectx-opt-' + n + '-' + i;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.setAttribute('data-i', i);
      li.textContent = o.textContent;
      ul.appendChild(li);
    });

    var champ = null;
    if (select.options.length >= SEUIL_RECHERCHE) {
      var boite = document.createElement('div');
      boite.className = 'selectx-search';
      champ = document.createElement('input');
      champ.type = 'text';
      champ.className = 'selectx-input';
      champ.autocomplete = 'off';
      champ.spellcheck = false;
      champ.placeholder = 'Rechercher…';
      champ.setAttribute('role', 'combobox');
      champ.setAttribute('aria-expanded', 'true');
      champ.setAttribute('aria-autocomplete', 'list');
      champ.setAttribute('aria-controls', ul.id);
      champ.setAttribute('aria-label', nom ? 'Rechercher : ' + nom : 'Rechercher');
      boite.appendChild(champ);
      p.appendChild(boite);
    }

    p.appendChild(ul);

    var vide = document.createElement('p');
    vide.className = 'selectx-vide';
    vide.textContent = 'Aucun résultat.';
    vide.hidden = true;
    p.appendChild(vide);

    document.body.appendChild(p);
    p.__champ = champ;
    p.__vide = vide;
    p.__liste = ul;
    return p;
  }

  /* ---------- placement ----------
     Le panneau est posé sur <body> en position fixe : un ancêtre en
     overflow:hidden ou porteur d'un backdrop-filter — c'est le cas de la
     barre de recherche du héro — le rognerait autrement. */

  function place() {
    if (!ouvert) return;
    var r = ouvert.select.getBoundingClientRect();
    var p = ouvert.panneau;
    p.style.width = Math.max(r.width, 232) + 'px';
    var l = Math.min(r.left, window.innerWidth - p.offsetWidth - 14);
    p.style.left = Math.max(14, l) + 'px';

    var bas = window.innerHeight - r.bottom - 14;
    var haut = r.top - 14;
    if (bas < 190 && haut > bas) {
      p.classList.add('est-en-haut');
      p.style.top = 'auto';
      p.style.bottom = (window.innerHeight - r.top + 2) + 'px';
      p.style.maxHeight = Math.min(PANNEAU_MAX, haut) + 'px';
    } else {
      p.classList.remove('est-en-haut');
      p.style.bottom = 'auto';
      p.style.top = (r.bottom + 2) + 'px';
      p.style.maxHeight = Math.min(PANNEAU_MAX, bas) + 'px';
    }
  }

  /* ---------- parcours ---------- */

  function visibles() {
    return ouvert.opts.filter(function (li) {
      return !li.classList.contains('est-masque') && !li.classList.contains('est-inactif');
    });
  }

  function marque(i) {
    if (!ouvert) return;
    var li = ouvert.opts[i];
    if (!li || li.classList.contains('est-masque')) return;
    ouvert.opts.forEach(function (x) {
      x.classList.remove('est-actif');
      x.setAttribute('aria-selected', 'false');
    });
    li.classList.add('est-actif');
    li.setAttribute('aria-selected', 'true');
    ouvert.actif = i;
    if (ouvert.champ) ouvert.champ.setAttribute('aria-activedescendant', li.id);
    /* On suit la valeur du <select> pas à pas, comme le fait une liste native
       sous Windows : le lecteur d'écran annonce ainsi chaque option parcourue.
       L'évènement « change » n'est émis qu'à la validation. */
    ouvert.select.selectedIndex = i;

    var zone = ouvert.panneau;
    var hautLi = li.offsetTop, basLi = hautLi + li.offsetHeight;
    var deca = ouvert.champ ? ouvert.champ.parentNode.offsetHeight : 0;
    if (hautLi - deca < zone.scrollTop) zone.scrollTop = Math.max(0, hautLi - deca);
    else if (basLi > zone.scrollTop + zone.clientHeight) zone.scrollTop = basLi - zone.clientHeight;
  }

  function deplace(pas) {
    if (!ouvert) return;
    var v = visibles();
    if (!v.length) return;
    var courant = ouvert.opts[ouvert.actif];
    var k = v.indexOf(courant);
    if (k === -1) k = pas > 0 ? -1 : 0;
    k = (k + pas + v.length) % v.length;
    marque(+v[k].getAttribute('data-i'));
  }

  /* ---------- filtre ---------- */

  function filtre() {
    if (!ouvert || !ouvert.champ) return;
    var q = aplat(ouvert.champ.value.trim());
    var trouves = 0;
    ouvert.opts.forEach(function (li) {
      var ok = !q || aplat(li.textContent).indexOf(q) !== -1;
      li.classList.toggle('est-masque', !ok);
      if (ok && !li.classList.contains('est-inactif')) trouves++;
    });
    ouvert.panneau.__vide.hidden = trouves > 0;
    ouvert.panneau.scrollTop = 0;
    /* On porte le surlignage sur le premier résultat, pour que Entrée ait
       toujours une cible évidente. */
    var v = visibles();
    if (v.length) marque(+v[0].getAttribute('data-i'));
    place();
  }

  /* ---------- ouverture et fermeture ---------- */

  function ouvre(select) {
    if (ouvert && ouvert.select === select) return ferme(false);
    if (ouvert) ferme(false);
    var p = select.__selectx || (select.__selectx = construit(select));
    ouvert = {
      select: select,
      panneau: p,
      champ: p.__champ,
      opts: Array.prototype.slice.call(p.querySelectorAll('.selectx-opt')),
      actif: -1,
      indexDepart: select.selectedIndex
    };
    p.classList.add('est-ouvert');
    select.classList.add('selectx-actif');
    ouvert.opts.forEach(function (li) { li.classList.remove('est-masque'); });
    p.__vide.hidden = true;
    if (ouvert.champ) ouvert.champ.value = '';
    place();
    p.scrollTop = 0;
    /* La coche marque le choix en vigueur à l'ouverture ; le surlignage, lui,
       suit le parcours. Les deux ne disent pas la même chose. */
    ouvert.opts.forEach(function (li, i) {
      li.classList.toggle('est-choisi', i === ouvert.indexDepart);
    });
    marque(select.selectedIndex);
    if (ouvert.champ) ouvert.champ.focus();
  }

  function ferme(valide) {
    if (!ouvert) return;
    var o = ouvert;
    ouvert = null;
    o.panneau.classList.remove('est-ouvert');
    o.select.classList.remove('selectx-actif');
    if (valide) {
      if (o.select.selectedIndex !== o.indexDepart) {
        o.select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else {
      o.select.selectedIndex = o.indexDepart;
    }
    if (document.activeElement !== o.select) o.select.focus();
  }

  /* ---------- clavier ----------
     Les mêmes touches, que le focus soit resté sur le <select> (panneau sans
     recherche) ou passé dans le champ (panneau avec recherche). */

  function touches(e) {
    var k = e.key;
    if (k === 'ArrowDown')      { e.preventDefault(); deplace(1); }
    else if (k === 'ArrowUp')   { e.preventDefault(); deplace(-1); }
    else if (k === 'Home')      { e.preventDefault(); var a = visibles(); if (a.length) marque(+a[0].getAttribute('data-i')); }
    else if (k === 'End')       { e.preventDefault(); var b = visibles(); if (b.length) marque(+b[b.length - 1].getAttribute('data-i')); }
    else if (k === 'PageDown')  { e.preventDefault(); for (var i = 0; i < 5; i++) deplace(1); }
    else if (k === 'PageUp')    { e.preventDefault(); for (var j = 0; j < 5; j++) deplace(-1); }
    else if (k === 'Enter')     { e.preventDefault(); if (visibles().length) ferme(true); }
    else if (k === 'Escape')    {
      e.preventDefault();
      /* Première échappée : on efface la recherche. Deuxième : on ferme. */
      if (ouvert.champ && ouvert.champ.value) { ouvert.champ.value = ''; filtre(); }
      else ferme(false);
    }
    else if (k === 'Tab')       { ferme(true); }
    else return false;
    return true;
  }

  /* ---------- branchement ---------- */

  document.querySelectorAll('select').forEach(function (select) {
    if (select.multiple || select.size > 1) return;

    /* preventDefault sur mousedown empêche la liste du système de s'ouvrir.
       Si un navigateur ne l'honore pas, c'est elle qui s'affiche : le site
       reste utilisable, il perd seulement l'habillage. */
    select.addEventListener('mousedown', function (e) {
      e.preventDefault();
      /* preventDefault annule aussi la prise de focus par défaut : on la refait,
         sans quoi le champ ne recevrait plus le clavier. */
      select.focus();
      ouvre(select);
    });

    select.addEventListener('keydown', function (e) {
      var k = e.key;
      if (!ouvert || ouvert.select !== select) {
        if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ') {
          e.preventDefault();
          ouvre(select);
        }
        return;
      }
      if (touches(e)) return;
      /* Panneau sans champ de recherche : la frappe reste une recherche par
         initiales, comme sur une liste native. */
      if (!ouvert.champ && k === ' ') { e.preventDefault(); ferme(true); }
      else if (!ouvert.champ && k.length === 1) {
        e.preventDefault();
        initiales(k);
      }
    });

    select.addEventListener('blur', function (e) {
      if (!ouvert || ouvert.select !== select) return;
      /* Le focus qui part dans le panneau (champ de recherche) n'est pas une
         sortie : c'est la suite du même geste. */
      if (e.relatedTarget && ouvert.panneau.contains(e.relatedTarget)) return;
      ferme(true);
    });
  });

  /* Recherche par initiales, pour les panneaux sans champ. */
  var tampon = '', tamponT = null;
  function initiales(lettre) {
    clearTimeout(tamponT);
    tampon += lettre.toLowerCase();
    tamponT = setTimeout(function () { tampon = ''; }, 700);
    var v = visibles();
    for (var i = 0; i < v.length; i++) {
      if (aplat(v[i].textContent.trim()).indexOf(aplat(tampon)) === 0) {
        marque(+v[i].getAttribute('data-i'));
        return;
      }
    }
  }

  /* Le champ de recherche : frappe et touches de parcours. */
  document.addEventListener('input', function (e) {
    if (ouvert && e.target === ouvert.champ) filtre();
  });
  document.addEventListener('keydown', function (e) {
    if (ouvert && e.target === ouvert.champ) touches(e);
  });
  document.addEventListener('focusout', function (e) {
    if (!ouvert || !ouvert.champ || e.target !== ouvert.champ) return;
    if (e.relatedTarget && (ouvert.panneau.contains(e.relatedTarget) || e.relatedTarget === ouvert.select)) return;
    ferme(true);
  });

  /* Un clic sur une option valide ; ailleurs, il ferme. */
  document.addEventListener('mousedown', function (e) {
    if (!ouvert) return;
    var li = e.target.closest ? e.target.closest('.selectx-opt') : null;
    if (li && ouvert.panneau.contains(li)) {
      e.preventDefault();
      if (li.classList.contains('est-inactif')) return;
      marque(+li.getAttribute('data-i'));
      ferme(true);
      return;
    }
    if (ouvert.panneau.contains(e.target)) return;   // clic dans le champ de recherche
    if (e.target !== ouvert.select) ferme(true);
  }, true);

  document.addEventListener('mouseover', function (e) {
    if (!ouvert) return;
    var li = e.target.closest ? e.target.closest('.selectx-opt') : null;
    if (li && ouvert.panneau.contains(li) && !li.classList.contains('est-inactif')) {
      marque(+li.getAttribute('data-i'));
    }
  });

  /* Le panneau étant en position fixe, il ne suit pas la page : on le replace.
     Le « true » écoute aussi les défilements internes, pas seulement la fenêtre. */
  window.addEventListener('scroll', function (e) {
    if (ouvert && e.target === ouvert.panneau) return;   // défilement du panneau lui-même
    place();
  }, true);
  window.addEventListener('resize', place);
})();

/* ==========================================================================
   VISIONNEUSE — agrandir une image de la galerie
   --------------------------------------------------------------------------
   Les photos d'un circuit étaient décoratives : on ne pouvait pas les regarder.
   La visionneuse est écrite ici plutôt qu'empruntée à une bibliothèque — celles
   du marché (magnific-popup et consorts) réclament jQuery, soit 90 Ko pour une
   boîte noire de cent lignes.

   Le <dialog> natif aurait fait l'affaire, mais son support de la fermeture au
   clic extérieur et de l'animation reste inégal ; on s'en tient à une div avec
   le contrat ARIA complet : rôle, modalité, piège à focus, restitution du focus.
   ========================================================================== */
(function () {
  var groupes = Array.prototype.slice.call(document.querySelectorAll('.gallery'));
  if (!groupes.length) return;

  var boite = null, images = [], index = 0, declencheur = null;

  function construit() {
    var d = document.createElement('div');
    d.className = 'visionneuse';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-modal', 'true');
    d.setAttribute('aria-label', 'Agrandissement des photos');
    d.innerHTML =
      '<button type="button" class="visionneuse-fermer" aria-label="Fermer">' +
        '<i class="fa-solid fa-circle-xmark" aria-hidden="true"></i></button>' +
      '<button type="button" class="visionneuse-prec" aria-label="Photo précédente">' +
        '<i class="fa-solid fa-angle-right" aria-hidden="true"></i></button>' +
      '<button type="button" class="visionneuse-suiv" aria-label="Photo suivante">' +
        '<i class="fa-solid fa-angle-right" aria-hidden="true"></i></button>' +
      '<figure class="visionneuse-scene">' +
        '<img alt="">' +
        '<figcaption><span class="visionneuse-legende"></span>' +
        '<span class="visionneuse-compte" aria-live="polite"></span></figcaption>' +
      '</figure>';
    document.body.appendChild(d);

    d.querySelector('.visionneuse-fermer').addEventListener('click', ferme);
    d.querySelector('.visionneuse-prec').addEventListener('click', function () { va(-1); });
    d.querySelector('.visionneuse-suiv').addEventListener('click', function () { va(1); });
    /* Le clic sur le fond ferme ; le clic sur la photo, non. */
    d.addEventListener('mousedown', function (e) {
      if (e.target === d || e.target.classList.contains('visionneuse-scene')) ferme();
    });
    return d;
  }

  function montre(i) {
    index = (i + images.length) % images.length;
    var src = images[index];
    var img = boite.querySelector('img');
    img.src = src.getAttribute('data-grand') || src.src;
    img.alt = src.alt || '';
    boite.querySelector('.visionneuse-legende').textContent = src.alt || '';
    boite.querySelector('.visionneuse-compte').textContent =
      images.length > 1 ? index + 1 + ' / ' + images.length : '';
    var seule = images.length < 2;
    boite.querySelector('.visionneuse-prec').hidden = seule;
    boite.querySelector('.visionneuse-suiv').hidden = seule;
  }

  function va(pas) { montre(index + pas); }

  function ouvre(groupe, img) {
    images = Array.prototype.slice.call(groupe.querySelectorAll('img'));
    declencheur = img;
    boite = boite || construit();
    montre(images.indexOf(img));
    document.body.classList.add('a-visionneuse');
    boite.classList.add('est-ouverte');
    boite.querySelector('.visionneuse-fermer').focus();
  }

  function ferme() {
    if (!boite || !boite.classList.contains('est-ouverte')) return;
    boite.classList.remove('est-ouverte');
    document.body.classList.remove('a-visionneuse');
    if (declencheur) declencheur.focus();
  }

  /* Ouverture : au clic, et au clavier puisque les images deviennent des
     commandes à part entière. */
  groupes.forEach(function (groupe) {
    groupe.querySelectorAll('img').forEach(function (img) {
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      if (img.alt) img.setAttribute('aria-label', 'Agrandir : ' + img.alt);
      img.addEventListener('click', function () { ouvre(groupe, img); });
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvre(groupe, img); }
      });
    });
  });

  document.addEventListener('keydown', function (e) {
    if (!boite || !boite.classList.contains('est-ouverte')) return;
    if (e.key === 'Escape')          { e.preventDefault(); ferme(); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); va(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); va(1); }
    else if (e.key === 'Tab') {
      /* Piège à focus : tant que la visionneuse est ouverte, la tabulation
         tourne à l'intérieur au lieu de repartir dans la page derrière. */
      var cibles = Array.prototype.filter.call(
        boite.querySelectorAll('button'), function (b) { return !b.hidden; });
      var i = cibles.indexOf(document.activeElement);
      var suiv = e.shiftKey ? i - 1 : i + 1;
      if (suiv < 0) suiv = cibles.length - 1;
      if (suiv >= cibles.length) suiv = 0;
      e.preventDefault();
      cibles[suiv].focus();
    }
  });
})();
