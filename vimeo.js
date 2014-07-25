/** @jsx React.DOM */

// flowplayer.conf = {
//    debug: true,
// };

// var assert = function (condition, message) {
//     if (!condition) {
//         throw message || "Assertion failed";
//     }
// };
var playerElement=document.getElementById('player1');
var isVimeo= function(){
    //return !!CourseData.currentLesson.video_vimeo;
    return $(playerElement).is('iframe');
};
var Player = function() {
    var that = this;

    // video inicial
    this.video = {
        title: CourseData.currentLesson.title,
        videoId: CourseData.currentLesson.id_lesson,
        videoType: "talkshow",
        video: {
            "key": CourseData.currentLesson.video_key,
            "mp4": CourseData.currentLesson.video,
        },
        trailer: {
            "mp4": CourseData.currentLesson.trailer,
        }
    };

    //usar de preferencia a do vimeo
    this.element=playerElement;
    this.element_loop=document.getElementById('loop');

    window.player1_instance = that.api_principal = $f(this.element);
    window.loop_instance = that.api_loop = $f(this.element_loop);
    that.api_loop && that.api_loop.addEvent("ready",function(){
        that.api_loop.setVolume(0);
    });
    that.api_principal && that.api_principal.addEvent("ready",function(){
        that.api_principal.addEvent("finish",that.onFinish.bind(that));
    });
    setTimeout(function(){
        that.api_loop.setVolume && that.api_loop.setVolume(0);
    },3000);
    // ao clicar para tocar o vídeo
    $('.player-case .video span.play').on('click',this.onPlay.bind(this));
    if(CourseData.currentLesson.indisponivel == 1)
        $('.player-case .video span.play').hide();
    // flowplayer fallback
    flowplayer(function(api, root){
        switch(root[0].id){
            case "loop":
                that.api_loop = api;
                break;
            case "player1":
                that.api_principal = api;
                that.api_principal.bind("ready", that.addQs.bind(that));
                that.api_principal.bind("error", that.onError.bind(that));
                that.api_principal.bind("finish", that.onFinish.bind(that));
        }
    });
};

Player.prototype = {
    isPlaying: false,
    // @TODO refatorar: video mantem dados da aula, não apenas o video
    video: null,
    // @var SeletorQualidade
    seletorQualidade: null,
    // @var elemento bindado
    element: null,

    mostraOverlay: function (){
        $('.player-case .video-principal').removeClass('ativo');
        $('.player-case #loop, .player-case .video .play').removeClass('inativo');

        if (larguraJanela > 1000) {
          $('.player-case .carrossel-cursos').addClass('ativo').removeClass('lateral');
        } else {
          $('.player-case .chamada').removeClass('inativo');
        }

        $('.player-case .chamada').addClass('inativo');

        removeElementos('principal');
        $('div.player-case > div.video > h1').show();
    },

    setVideo: function (v) {
        this.video = v;
    },

    getCurrentLesson: function () {
        return this.video;
    },
    vimeoUrl: function(player_id,vimeo_id, autoplay, loop){
        return 'http://player.vimeo.com/video/'+vimeo_id+'?api=1&autopause=1&autoplay='+(autoplay?'1':'0')+'&badge=0&color=00adef&loop='+(loop?'1':'0')+'&player_id='+player_id+'&portrait=0&title=0';
    },
    load: function () {
        var that = this;
        var aula = this.video;

        $('div.player-case > div.video > h1').text(aula.title);
        $('.player-case .video span.play').show();
        if(aula.indisponivel == 1)
            $('.player-case .video span.play').hide();

        var loopUrl=aula.trailer.vimeo ? this.vimeoUrl('loop',aula.trailer.vimeo,true,true) : aula.trailer.mp4;
        var url=aula.video.vimeo ? this.vimeoUrl('player1',aula.video.vimeo) : aula.video.mp4;
        try {
            //load muted
            that.api_loop.load(loopUrl,function(e){
                if(that.api_loop.setVolume)
                    that.api_loop.setVolume(0);
            });
            //
            that.api_principal.load(url, function (e) {
                that.api_principal.pause();
            });
            that.seletorQualidade && that.seletorQualidade.setState({
                'selectedRes': that.seletorQualidade.defaultRes
            });
            that.mostraOverlay();
        } catch (e) {
            noty({
                text: "Erro ao carregar video.",
                type: "error",
                timeout: 2500,
            });
            console.log(e);
        }
    },

    seek: function (seconds) {
        // play via seek
        $('div.player-case > div.video > h1').hide();
        $('.player-case #loop, .player-case .chamada, .player-case .video span.play').addClass('inativo');
        removeElementos();
        $('.player-case .video-principal').addClass('ativo');

        try {
            this.api_principal.seek(seconds).play();
        } catch (e) {
            console.log('seek error',e);
            // avisar o usuário?
        }
    },

    logPlay: function () {
        var id_lesson = this.video.videoId;
        var params = {
            host : location.host || location.hostname,
            url : location.pathname,
            url_base : location.pathname,
            url_query : '?aula=' + id_lesson,
            screenWidth : window.screen.width,
            screenHeight : window.screen.height,
        };
        GV.get('/analytics/accessParam',params,function(){});
    },
    addQs: function(){
        var that=this;
        var fpui = $(".fp-ui",that.element);
        var mountpoint_qs = $("<div/>").addClass("fp-qsel-base").appendTo(fpui);
        that.seletorQualidade = React.renderComponent(<SeletorQualidade api={that.api_principal} player={that} />, mountpoint_qs.get(0));
    },
    onPlay: function(){
        var that=this;
        $('div.player-case > div.video > h1').hide();
        $('.player-case #loop, .player-case .chamada, .player-case .video span.play').addClass('inativo');
        removeElementos();
        $('.player-case .video-principal').addClass('ativo');
        try {
            that.api_principal.seek(0).play();
            that.logPlay();
        } catch (e) {
            console.log('play click error',e);
            noty({
                text: "Erro ao reproduzir video.",
                type: "error",
                timeout: 2500,
            });
        }
    },
    onFinish: function(e) {
        var that=this;
        that.mostraOverlay();

        var action = "";
        switch (that.video.videoType) {
            case 'talkshow':
                action = "markTalkShowViewed";
                break;
            case 'lesson':
                action = "markLessonViewed";
                break;
        }

        if (action !== "") {
            // @TODO fazer isso com uma requisicao
            GV.post("/course/" + action, { id_lesson: that.video.videoId, id_course: CourseData.course.id_course }, function (data) {
                GV.get("/course/checklistProgress", { id_course: CourseData.course.id_course }, function (data) {
                    app.pageMenu.setState({
                        metas: data.checklists,
                    });
                    app.courseNav.setState({
                        progressCount: data.progressCount,
                        percentProgress: data.progress,
                    });
                });
            });
        }
    },
    // tratar erros
    onError: function (e, api, err) {
        var that=this;
        var msg;
        var errorMsg = function (title, msg) {
           var $fpmsg = $(".fp-message", that.element);
           $('h2', $fpmsg).text(title);
           $('p', $fpmsg).html(msg);
        };
        switch (err.code) {
            case 2: // Network error
                msg = 'Houve um problema de rede para reproduzir o video';
                msg += ', verifique sua conexão e <a href="' + location.href +
                    '">tente novamente</a>';
                errorMsg('Erro de rede', msg);
                break;
            case 4: // Video file not found
                msg = 'Houve um problema para reproduzir o video';
                msg += ', por favor <a href="' + location.href +
                    '">tente novamente</a>';
                errorMsg('Erro ao reproduzir video', msg);
                break;
        }
        console.log('error event',arguments);
    }
};

var FlashPlayer = function() {
    var that = this;
    // ao clicar para tocar o vídeo
    $('.player-case .video span.play').on('click', function(){
        that.hideOverlay();
        that.play();
    });
    if(CourseData.currentLesson.indisponivel == 1){
        $('.player-case .video span.play').hide();
    }
};

FlashPlayer.prototype = {
    video: null,
    play: function() {
        var that = this;
        try {
            if (this.video && window.player1_instance.addClip)
                window.player1_instance.addClip(this.video.trailer.mp4, 0);
            window.player1_instance.seek(0).play();
        } catch (e) {
            console.log('play error',e);
            noty({
                text: "Erro ao reproduzir video.",
                type: "error",
                timeout: 2500,
            });
        }
        window.player1_instance.onFinish(function() {
            that.mostraOverlay();
        });
    },
    mostraOverlay: function (){
        $('.player-case .video-principal').removeClass('ativo');
        $('.player-case #loop, .player-case .video .play, .player-case .video span.countdown, .liveended').removeClass('inativo');

        if (larguraJanela > 1000) {
          $('.player-case .carrossel-cursos').addClass('ativo').removeClass('lateral');
        } else {
          $('.player-case .chamada').removeClass('inativo');
        }

        $('.player-case .chamada').addClass('inativo');

        removeElementos('principal');
        $('div.player-case > div.video > h1').show();
    },
    hideOverlay: function() {
        $('div.player-case > div.video > h1').hide();
        $('.player-case #loop, .player-case .chamada, .player-case .video span.play, .player-case .video span.countdown, .liveended').addClass('inativo');
        removeElementos();
        $('.player-case .video-principal').addClass('ativo');
    },
    setVideo: function (v) {
        this.video = v;
    },
    load: function () {
        var that = this;
        var aula = this.video;

        $('div.player-case > div.video > h1').text(aula.title);
        $('.player-case .video span.play').show();

        if(aula.indisponivel == 1)
            $('.player-case .video span.play').hide();

        try {
            if(window.loop_instance.addClip)
                window.loop_instance.addClip(aula.trailer.mp4, 0);
            window.loop_instance.seek(0).play();
        } catch (e) {
            console.log('load error',e);
            noty({
                text: "Erro ao reproduzir video.",
                type: "error",
                timeout: 2500,
            });
        }
    }
};

var LivePlayer = function() {
    // ao clicar para tocar o vídeo
    $('.player-case .video span.play').on('click', function(){

        this.hideOverlay();

        this.play();

    }.bind(this));
    if(CourseData.currentLesson.indisponivel == 1){
        $('.player-case .video span.play').hide();
    }
};

LivePlayer.prototype = {
    play: function() {
        $("#player1").remove();
        try {
            window.liveplayer1_instance.play();
        } catch (e) {
            console.log('live player error',e);
            noty({
                text: "Erro ao reproduzir video.",
                type: "error",
                timeout: 2500,
            });
        }

        if (CourseData.currentLesson.live_fallback) {
            $('p.live-alternate-link').show();
            $('p.live-alternate-link > a').click(function(e){
                e.preventDefault();
                this.fallback(CourseData.currentLesson.live_fallback);
                return false;
            }.bind(this));
        }
    },
    hideOverlay: function() {
        $('div.player-case > div.video > h1').hide();
        $('.player-case #loop, .player-case .chamada, .player-case .video span.play, .player-case .video span.countdown, .liveended').addClass('inativo');
        removeElementos();
        $('.player-case .video-principal').addClass('ativo');
    },
    fallback: function(content) {
        if ($("#liveplayer1 > iframe").length > 0) {
            $("#liveplayer1 > iframe").remove();
            $("#liveplayer1_api").show();
            window.liveplayer1_instance.onLoad(function(){
                this.play();
            });
        } else {
            window.liveplayer1_instance.stop();
            $("#liveplayer1_api").hide();
            $("#liveplayer1").append(content);
        }
    }
};

var CourseApp = function () {
    var that = this;
    this.renderComponents();
    // CourseData.talkShows[0].lessons[0].topics
    // carregar lista inicial de topicos
    var aula  = this.findAulaById(CourseData.currentLesson.id_lesson);

    if (CourseData.currentLesson.kind == 'LIVE') {
        if (CourseData.currentLesson.live_started == 0 || CourseData.currentLesson.live_done == 1) {
            this.player = new FlashPlayer();
            if (CourseData.currentLesson.live_started == 0 && CourseData.currentLesson.live_done == 0) {
                var live_start = CourseData.currentLesson.live_start.replace(new RegExp(/:/),"-")
                        .replace(new RegExp(/\s/),"-").split("-");
                $(".video > .countdown").countdown({
                    until: new Date(parseInt(live_start[0]), parseInt(live_start[1])-1, parseInt(live_start[2]), parseInt(live_start[3]), parseInt(live_start[4])),
                    //until: new Date(2014, 06-1, 20, 11, 04),
                    onExpiry: function(){
                        that.liveplayer = new LivePlayer();
                        $('.player-case .video span.play').trigger('click');
                    }
                });
            } else {
                $(".video > .liveended").html('Evento finalizado<small>Estamos editando o video e publicaremos na íntegra assim que possível.</small>');
            }
        } else {
            this.liveplayer = new LivePlayer();
        }
    } else {
        this.player = new Player();
    }

    this.pageMenu.setState({
        topicos: aula.topics
    });
};

CourseApp.prototype = {
    player: null,
    liveplayer: null,
    aulaAtual: null,
    abrindoAula: false,

    renderComponents: function () {
        this.pageMenu = React.renderComponent(
            <MenuAula onTalkshowClick={this.abrirTalkshow.bind(this)} />, document.getElementById("menu-aula")
        );

        this.courseNav = React.renderComponent(
            <CourseNav />, document.getElementById("page-footer")
        );

        this.ferramentas = React.renderComponent(
            <Ferramentas />, document.getElementById("ferramentas")
        );

        this.talkShowsBottom = React.renderComponent(
            <TalkshowListBottom onTalkshowClick={this.abrirTalkshow.bind(this)} />, document.getElementById("chamada")
        );

        this.aulasTalkShow = React.renderComponent(
            <AulasTalkshowList onTalkshowClick={this.abrirTalkshow.bind(this)} />, document.getElementById("aulas_talkshow")
        );
    },

    abrirAula: function (aula, autoPlay, checklist) {
        //removido pq vimeo
        //@TODO voltar carregar com ajax
        if(isVimeo()){
            // window.location=window.location.pathname+
            //     '?aula='+aula.id_lesson+
            //     '&autoplay='+(autoPlay?'1':'0')+
            //     (checklist ? '#checklist':'');
            // return;
        } else
            window.location.hash='';
        if (this.abrindoAula === true) {
            return null;
        }

        var action = "";
        switch (aula.type) {
            case 'talkshow':
                action = "talkShowView";
                break;
            case 'lesson':
                action = "lessonView";
                break;
            default:
                return false;
        }

        var id_lesson = parseInt(aula.id_lesson, 10);
        var params = { id: aula.id_lesson };

        this.aulaAtual = aula;
        this.abrindoAula = true;

        GV.get("/course/" + action, params, function (data) {
            this.pageMenu.setState({
                topicos: aula.topics,
                anexos: data.attachments,
                palestrantes: data.panelists,
            });

            this.ferramentas.setState({
                user_like_lesson: data.userLike,
                lesson_likes: aula.likes,
                questions: data.questions,
                parent_item: id_lesson,
            });

            if (aula.type == "talkshow") {
                this.aulasTalkShow.carregarAulas(id_lesson);
            }

            this.courseNav.setState({
                idAulaAtual: id_lesson
            });

            this.abrindoAula = false;
        }.bind(this));

        this.carregarVideo(aula, autoPlay);

        this.aulasTalkShow.setState({
            ativo: aula.id_lesson
        });
    },

    abrirTalkshow: function (talkshowItem) {
        var aula = this.findAulaById(talkshowItem.props.id_lesson);
        //this.abrirAula(aula, true);
        this.abrirAula(aula, false);
    },

    /* TODO mover lista de aulas e aula atual do courseNav para CourseApp */
    findAulaById: function (id_lesson) {
        var aulas = this.courseNav.state.aulas;
        var indexOfAula = this.courseNav.indexOfAula(id_lesson);
        return aulas[indexOfAula];
    },

    abrirAulaById: function (id_lesson, autoPlay, checklist) {
        var aula = this.findAulaById(id_lesson);
        this.abrirAula(aula, autoPlay, checklist);
    },
    carregarVideo: function (aula, autoPlay) {
        var video = {
            title: aula.title,
            videoId: aula.id_lesson,
            videoType: aula.type,
            video: {
                "key": aula.video_key,
                "mp4": aula.video,
                "ogg": "",
                "webm": "",
                "vimeo": aula.video_vimeo,//12996760,//
            },
            trailer: {
                "mp4": aula.trailer,
                "ogg": "",
                "webm": "",
                "vimeo": aula.trailer_vimeo,//12996760,//
            },
            indisponivel: aula.indisponivel
        };

        if (CourseData.currentLesson.kind == 'LIVE' && CourseData.currentLesson.live_started == 1 && CourseData.currentLesson.live_done == 0) {
            this.liveplayer.hideOverlay();
            this.liveplayer.play();
        } else {
            this.player.setVideo(video);
            this.player.load();
        }

        // this.playerAula.setState(video, function () {
        //     if (autoPlay === true) {
        //         $('.player-case .video span.play').click();
        //     }
        // });
    },
};

var app = new CourseApp();

// $('#loop').css({
//     width: '1024px', height: '768px'
// });
