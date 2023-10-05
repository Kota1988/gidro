//команды галпа
const { src, dest, watch, parallel, series } = require('gulp');
const scss = require('gulp-sass')(require('sass'));
//Плагины которые устанавливаются из npm в папку node-modules

//плагин для конкатенации файлов
const concat = require('gulp-concat');
//плагин подстановки нужных префиксов для каждого браузера
const autoprefixer = require('gulp-autoprefixer');
//плагин для сжатия JS файлов в формат min.js
const uglify = require('gulp-uglify');
//плагин для отслеживания 
const browserSync = require('browser-sync').create();
//плагин для минификации картинок (работает только с версией "gulp-imagemin": "^7.1.0",)
const imagemin = require('gulp-imagemin');

//плагин самой npm (работает только с версией "del": "^6.1.1",)
const del = require('del');

// таск перезагрузки страницы
function browsersync() {
    //инициализация сервера в указанной папке
    browserSync.init({
        server: {
            baseDir: 'app/'
        },
        //отключение уведомлений
        notify: false
    })
}
//таск для стилей
function styles() {
    //берем scss 
    return src('app/scss/style.scss')
        //форматируем в css в указанном формате
        .pipe(scss({ outputStyle: 'compressed' }))
        //соединяем файлы (если их указано выше несколько)и переименовываем как нам надо
        .pipe(concat('style.min.css'))
        //добавляем префиксы для 10 последних версий любого браузера
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 10 versions'],
            // для IE 
            grid: true
        }))
        //выкидываем в папку css
        .pipe(dest('app/css'))
        //включение стрима (обновление стилей без перзагрузки)
        .pipe(browserSync.stream())
}
//таск для скриптов
function scripts() {
    return src([
        //последовательность важна!!!

        //указываем путь к jquery в папке node-modules
        'node_modules/jquery/dist/jquery.js',
        //указываем путь к нашему файлу
        'app/js/main.js'
    ])
        //конкатенируем два файла в один файл со своим именем
        .pipe(concat('main.min.js'))
        //сжимаем плагином 
        .pipe(uglify())
        // выкидываем в папку js
        .pipe(dest('app/js'))
        //включение стрима (обновление js на странице)
        .pipe(browserSync.stream())
}

//таск для картинок
function images() {
    //указываем путь к несжатым картинкам
    return src('app/images/**/*.*')
        //сжимаем при помощи imagemin
        .pipe(imagemin([
            imagemin.gifsicle({ interlaced: true }),
            imagemin.mozjpeg({ quality: 75, progressive: true }),
            imagemin.optipng({ optimizationLevel: 5 }),
            imagemin.svgo({
                plugins: [
                    { removeViewBox: true },
                    { cleanupIDs: false }
                ]
            })
        ]))
        // выкидываем в папку с картинками
        .pipe(dest('dist/images'))
}
//таск сборки
function build() {
    //указываем что собирать
    return src([
        'app/**/*.html',
        'app/css/style.min.css',
        'app/js/main.min.js'
        //чтобы в файлы перенеслись в той же структуре что и в app
    ], { base: 'app' })
        .pipe(dest('dist'))
}
//таск удаления папки дист
function cleanDist() {
    return del('dist')
}

//таск для слежения за изменениями
function watching() {
    //указываем пути за кем следить (внутри папки scss во всех папках с любым именем, но с расширением scss) и применяем к ним определенный таск
    watch(['app/scss/**/*.scss'], styles);
    //указываем пути за кем следить (внутри папки js во всех папках с любым именем, но с расширением js)
    //но не за самим файлом main.min.js
    //и применяем к ним определенный таск
    watch(['app/js/**/*.js', '!app/js/main.min.js'], scripts);
    // указываем пути за кем следить (внутри папки app c расширением html) 
    // и если есть изменения browserSync перезагружает страницу
    watch(['app/**/*.html']).on('change', browserSync.reload);
}
//экспорт функций(тасков) в галп
exports.styles = styles;
exports.watching = watching;
exports.scripts = scripts;
exports.browsersync = browsersync;
exports.images = images;
exports.cleanDist = cleanDist;
//включение возможности запускa тасков по очереди (порядок запуска тасков важен!!!)
exports.build = series(cleanDist, images, build);
//включение возможности параллельного запуска тасков (порядок запуска тасков важен!!!)
exports.default = parallel(styles, scripts, browsersync, watching);
