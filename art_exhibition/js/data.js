/**
 * 画展数据 · 光在此处 · Light Stays Here
 * 4 主题 · 共 15 幅作品(01:3 / 02:4 / 03:4 / 04:4)
 * 新增作品:向对应 section.works 追加 { src, title, medium, year, desc } 即可。
 */
window.EXHIBITION = {
    title: '光在此处',
    subtitleEn: 'Light Stays Here',
    meta: 'VOL. 01 · 2026 CAMPUS CURATION',
    heroImage: 'art/art12.JPG',
    marquee: '光 · 影 · 墙 · 廊 · 窗 · 椅 · 雾 · 暮 · 2026 · LIGHT STAYS HERE · CDUT YIBIN · ',
    facts: [
        { label: '主题', value: '光与日常' },
        { label: '展期', value: '2026.03 — 2026.06' },
        { label: '场次', value: 'Online · Vol. I' }
    ],
    curator: {
        quote: '这一组照片没有远方，只有走廊、窗台、白墙和你坐过的椅子。日常被认真看过一次，就不再普通。',
        author: '—— 策展语',
        date: '写于 2026 年春 · 成都理工大学宜宾校区'
    },
    epilogue: {
        line:   '愿你记住这里的光',
        lineEn: 'May you remember the light here, and yourself within it.',
        line2:   '愿你被这些墙壁记住回声',
        line2En: 'May these walls keep your echo, and these floors keep your steps.'
    },
    sections: [
        {
            id: 'dawn',
            chapter: '01',
            title: '晨晖',
            titleEn: 'Dawn — Light Newborn',
            prelude: '一天中最早的光，干净、低角度、带着凉意。从远处建筑到近处窗台，光慢慢铺开。',
            layout: 'symmetric',
            backdrop: 'art/art18.png',
            works: [
                { src: 'art/art18.png', title: '教学楼顶的光', medium: '摄影 · Photography', year: '2026', distance: '远 · DISTANT', desc: '晨光最先落在屋顶的边缘，楼像被轻轻描了一道金边。天空还泛着青灰，但光已经来了。' },
                { src: 'art/art7.png', title: '光影成歌',     medium: '摄影 · Photography', year: '2026', distance: '中 · MIDDLE',  desc: '清晨的光从斜上方铺来，将操场的棚顶照成跳动的琴键。没有人的时候，阳光就悄悄在这里演奏。' },
                { src: 'art/art4.png', title: '晴光环转，云影绕街',   medium: '摄影 · Photography', year: '2026', distance: '近 · CLOSE',   desc: '云隙漏下的金辉，把环岛的路面铺成了旋转的琴键。没有车驶过的时候，树影也在替这里，慢慢哼着松弛的歌。' },
                { src: 'art/art19.jpg', title: '暮色成理，书香漫檐', medium: '摄影 · Photography', year: '2026', distance: '尽头 · END', placement: 'end', desc: '对称的线条、向上延伸的塔楼，把理性的秩序写进了暮色里。这里没有刻意的张扬，却以一种不动声色的庄重，守护着每一份对知识的虔诚。' }
            ]
        },
        {
            id: 'folding',
            chapter: '02',
            title: '折影',
            titleEn: 'Folding Shadow — Geometry of Light',
            prelude: '光遇到建筑——连廊、楼梯、框架、百叶。它被折叠、切割、折射，变成空间的密语。',
            layout: 'filmstrip',
            backdrop: 'art/art10.jpg',
            works: [
                { src: 'art/art20.jpg', title: '校园里的清晨', medium: '建筑摄影 · Architecture', year: '2026', distance: '远 · DISTANT', desc: '晨光穿透林隙，在石板路上铺成碎金的河流。风穿过疏朗的枝桠，将光影揉成温柔的掌纹，红旗与白楼在晴蓝的天幕下静静伫立，连空气里，都浮动着独属于校园的、明亮而舒展的气息。', featured: true },
                { src: 'art/art10.jpg', title: '一砖一是初心', medium: '摄影 · Photography',     year: '2026', distance: '中 · MIDDLE',  desc: '浅灰的楼体如沉默的岩层，藏着跨越山海的地质浪漫。刻有校名的岩石上，每一笔红，都是成理人叩问地球的不悔初心。' },
                { src: 'art/art12.JPG', title: '香樟食堂里的阳光',    medium: '摄影 · Photography',     year: '2026', distance: '近 · CLOSE',   desc: '阳光为香樟食堂镀上一层暖金，玻璃映着澄澈的蓝天，也映着校园里最鲜活的日常。这是藏在理性学府里，最温柔的烟火气。' },
                { src: 'art/art3.png', title: '花事中的白楼', medium: '摄影 · Photography',     year: '2026', distance: '极近 · INTIMATE', desc: '晨光漫过校园的广场，白楼与云影在蓝天下舒展。理性的校训静静伫立，而一场盛大的花事，为严谨的学府，晕开了温柔的粉色浪漫。每一朵花，都是写给这里的一封情书。' }
            ]
        },
        {
            id: 'mottled',
            chapter: '03',
            title: '斑驳',
            titleEn: 'Mottled — Texture of Light',
            prelude: '光落在粗糙的、旧的、被使用过的表面上——树影、水痕、墙面、石刻。时间留下了痕迹，光把它照出来。',
            layout: 'collage',
            backdrop: 'art/art2.png',
            works: [
                { src: 'art/art2.png', title: '河湾上的慢时光', medium: '摄影 · Photography', year: '2026', style: 'polaroid', desc: '河道蜿蜒着流向远方，桥身横跨过岁月的慢镜头。远处的建筑、近处的草木，都在淡蓝色的天光里变得柔软，连风都放轻了脚步，怕惊扰了这一帧温柔的宁静。', featured: true },
                { src: 'art/art1.jpg', title: '银杏与钟楼',     medium: '摄影 · Photography', year: '2026', style: 'bare',     desc: '深秋的银杏枝桠间，藏着一整个季节的浪漫。老建筑的钟楼静静伫立，红旗在蓝天的映衬下格外鲜亮，风一吹，金叶轻晃，像在诉说着校园里独有的温柔故事。' },
                { src: 'art/art5.png', title: '跑道上的青春',   medium: '摄影 · Photography', year: '2026', style: 'polaroid', desc: '蓝天与白云为操场铺开了最干净的底色，跑道上的白标线，是青春里最清晰的注脚。看台的影子在地面慢慢移动，风里仿佛还藏着曾经的呐喊与心跳，安静又热烈。' },
                { src: 'art/art6.png', title: '白桥与晴空',     medium: '摄影 · Photography', year: '2026', style: 'bare',  desc: '小桥舒展着自身，以一道温柔的弧线，将蓝天、青山与学校轻轻串联起来。阳光漫过桥面，连风都带着山林的清新气息，把校园里的每一寸明亮与温柔，都妥帖安放。' }
            ]
        },
        {
            id: 'afterglow',
            chapter: '04',
            title: '余温',
            titleEn: 'Afterglow — Warmth of Dusk',
            prelude: '白昼退潮，温暖涨潮。光变成橙红色，变长，变软。它落在人身上、空椅子上、路灯亮起前的瞬间。',
            layout: 'vinyl',
            backdrop: 'art/art15.jpg',
            works: [
                { src: 'art/art17.jpg', title: '水面里的黄昏',   medium: '摄影 · Photography', distance: '中 · MIDDLE',  desc: '水面接住了整片黄昏的温柔。天光漫过楼宇，将云絮揉成碎金，树影与建筑在涟漪里轻轻摇晃，像一场安静的、永不落幕的梦。' },
                { src: 'art/art20.png', title: '夕光漫路夜温柔', medium: '摄影 · Photography', distance: '近 · CLOSE',   desc: '被草地包裹的石板路，像一条通往黄昏的秘密通道。光影在缝隙里跳动，走慢一点，就能接住晚风里的所有温柔。' },
                { src: 'art/art21.png', title: '夕色风车廊',   medium: '摄影 · Photography', distance: '极近 · INTIMATE', desc: '风路过这里时，悄悄拨动了一串彩虹色的梦。夕阳为透明的风车镀上暖光，光影在旋转里揉成碎金，一整条长廊，都浸在流动的温柔里，像一场永远不会结束的校园童话。', featured: true },
                { src: 'art/art22.png',  title: '镜中校园，日落无声', medium: '摄影 · Photography', distance: '远 · DISTANT',     desc: '当夕阳的光斜照进大厅，玻璃门成了一面温柔的画框。门外的树、远处的楼，都被地面的倒影轻轻接住，像把整个校园的黄昏，都收进了这方安静的空间里。' }
            ]
        }
    ]
};
