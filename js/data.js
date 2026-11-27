/* ==========================================================================
   PHIMMOIZ.ONE DATA ENGINE & LIVE API CONNECTOR (js/data.js)
   Nguồn dữ liệu thực tế từ https://phimmoiz.one/ + WP REST API + PhimAPI HLS
   ========================================================================== */

const PHIMMOI_CONFIG = {
  baseUrl: "https://phimmoiz.one",
  wpApiPosts: "https://phimmoiz.one/wp-json/wp/v2/posts",
  phimApiBase: "https://phimapi.com/phim/",
  phimApiSearch: "https://phimapi.com/v1/api/tim-kiem",
  phimApiLatest: "https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3",
  nguoncApiBase: "https://phim.nguonc.com/api/film/",
  nguoncApiSearch: "https://phim.nguonc.com/api/films/search",
  nguoncApiLatest: "https://phim.nguonc.com/api/films/phim-moi-cap-nhat",
  film4kBase: "https://film4k.net",
  film4kApiHome: "https://film4k.net/api/home",
  film4kApiTitle: "https://film4k.net/api/title/",
  film4kApiWatch: "https://film4k.net/api/watch/",
  film4kApiSuggest: "https://film4k.net/api/search/suggest?q=",
  allOriginsGet: "https://api.allorigins.win/get?url=",
  corsProxies: [
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?"
  ]
};

/**
 * Kho dữ liệu phim thực tế trích xuất trực tiếp từ https://phimmoiz.one/
 * Đảm bảo trang web hiển thị tức thì 0ms và luôn hoạt động mượt mà kể cả khi mạng chậm.
 */
const PHIMMOI_SEED_MOVIES = [
  {
  "id": "pa-kinh-van-hoa",
  "slug": "kinh-van-hoa",
  "crawlSlug": "kinh-van-hoa",
  "title": "Kính Vạn Hoa",
  "originTitle": "Kính Vạn Hoa (Trọn Bộ 28 Tập Bản Đẹp)",
  "poster": "https://image.tmdb.org/t/p/w500/uVGD2n70KQGS4VMpUK67rw5b5ob.jpg",
  "backdrop": "https://image.tmdb.org/t/p/w500/uVGD2n70KQGS4VMpUK67rw5b5ob.jpg",
  "type": "series",
  "sectionTags": [
    "hot",
    "vietnam",
    "phim-bo",
    "de-cu"
  ],
  "quality": "1080",
  "has4k": false,
  "language": "Tiếng Việt (Gốc TFS)",
  "duration": "45 phút/tập",
  "episodeCurrent": "Trọn Bộ 28/28 Tập",
  "episodeTotal": "28",
  "year": 2005,
  "rating": 9.9,
  "matchScore": 99,
  "country": "Việt Nam",
  "countrySlug": "viet-nam",
  "genres": [
    "Tuổi Học Trò",
    "Phiêu Lưu",
    "Hài Hước",
    "Kinh Điển Việt Nam"
  ],
  "director": "Nguyễn Minh Chung, Đỗ Phú Hải",
  "cast": [
    "Ngọc Trai (Quý ròm)",
    "Vũ Long (Tiểu Long)",
    "Anh Đào (Nhỏ Hạnh)"
  ],
  "ambientColors": [
    "#3b82f6",
    "#1e3a8a",
    "#0f172a"
  ],
  "trailerUrl": "https://www.youtube.com/watch?v=cG5ZZ2FB720",
  "synopsis": "Kính Vạn Hoa là bộ phim truyền hình thiếu nhi kinh điển của Việt Nam do Hãng phim Truyền hình TP.HCM (TFS) sản xuất, chuyển thể từ bộ truyện nổi tiếng cùng tên của nhà văn Nguyễn Nhật Ánh. Bộ phim xoay quanh bộ ba học trò tinh nghịch: Quý ròm thông minh lém lỉnh, Tiểu Long giỏi võ tốt bụng và Nhỏ Hạnh dịu dàng kiên nhẫn cùng những chuyến phiêu lưu kỳ thú tuổi học trò.",
  "episodes": [
    {
      "name": "Tập 1",
      "slug": "tap-1",
      "embed": "https://www.youtube.com/embed/cG5ZZ2FB720",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 2",
      "slug": "tap-2",
      "embed": "https://www.youtube.com/embed/KMj9cuiuzEs",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 3",
      "slug": "tap-3",
      "embed": "https://www.youtube.com/embed/oyG6NNfa-PA",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 4",
      "slug": "tap-4",
      "embed": "https://www.youtube.com/embed/n4mduwatyZ4",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 5",
      "slug": "tap-5",
      "embed": "https://www.youtube.com/embed/9XsZgVsVjNY",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 6",
      "slug": "tap-6",
      "embed": "https://www.youtube.com/embed/E8SLhtoYX2M",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 7",
      "slug": "tap-7",
      "embed": "https://www.youtube.com/embed/7meIxJszTRA",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 8",
      "slug": "tap-8",
      "embed": "https://www.youtube.com/embed/ZONqaPNki3E",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 9",
      "slug": "tap-9",
      "embed": "https://www.youtube.com/embed/_ytTmJs5TFM",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 10",
      "slug": "tap-10",
      "embed": "https://www.youtube.com/embed/T1Yw5t0cFug",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 11",
      "slug": "tap-11",
      "embed": "https://www.youtube.com/embed/ON0FXA0ecFU",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 12",
      "slug": "tap-12",
      "embed": "https://www.youtube.com/embed/PxFRFMPqPPU",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 13",
      "slug": "tap-13",
      "embed": "https://www.youtube.com/embed/LqelP6SejAE",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 14",
      "slug": "tap-14",
      "embed": "https://www.youtube.com/embed/K657qZK0FMQ",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 15",
      "slug": "tap-15",
      "embed": "https://www.youtube.com/embed/fiGgniFZhFA",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 16",
      "slug": "tap-16",
      "embed": "https://www.youtube.com/embed/Kl_Q4me3XD0",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 17",
      "slug": "tap-17",
      "embed": "https://www.youtube.com/embed/tadWhDjoK60",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 18",
      "slug": "tap-18",
      "embed": "https://www.youtube.com/embed/isfSgkeCgHc",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 19",
      "slug": "tap-19",
      "embed": "https://www.youtube.com/embed/UmyCjSY07TU",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 20",
      "slug": "tap-20",
      "embed": "https://www.youtube.com/embed/scCyZSqDmWI",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 21",
      "slug": "tap-21",
      "embed": "https://www.youtube.com/embed/0w3GcLE7wYQ",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 22",
      "slug": "tap-22",
      "embed": "https://www.youtube.com/embed/1att-rQ2hVU",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 23",
      "slug": "tap-23",
      "embed": "https://www.youtube.com/embed/VAT86B0FfJg",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 24",
      "slug": "tap-24",
      "embed": "https://www.youtube.com/embed/8OMuSI2uNMg",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 25",
      "slug": "tap-25",
      "embed": "https://www.youtube.com/embed/-cQMRAmXw3s",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 26",
      "slug": "tap-26",
      "embed": "https://www.youtube.com/embed/biGwsCAS8nI",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 27",
      "slug": "tap-27",
      "embed": "https://www.youtube.com/embed/ZryVrKywqeQ",
      "source": "",
      "is4k": false
    },
    {
      "name": "Tập 28",
      "slug": "tap-28",
      "embed": "https://www.youtube.com/embed/FY9RCVQt3x4",
      "source": "",
      "is4k": false
    }
  ]
},

  {
    "id": "pa-ke-kien-tao",
    "slug": "ke-kien-tao",
    "crawlSlug": "ke-kien-tao",
    "title": "Kẻ Kiến Tạo",
    "originTitle": "The Creator",
    "poster": "https://phimimg.com/upload/vod/20251010-1/e6f308eb5366226d016045c3b80d37ca.jpg",
    "backdrop": "https://phimimg.com/upload/vod/20251010-1/1f1c6b6ff250e556050b9263967174d2.jpg",
    "type": "single",
    "sectionTags": [
      "hot",
      "vietsub",
      "ai",
      "phim-le"
    ],
    "quality": "FHD",
    "language": "Vietsub",
    "duration": "134 phút",
    "episodeCurrent": "Full",
    "episodeTotal": 1,
    "year": 2023,
    "rating": 9.4,
    "matchScore": 98,
    "country": "Canada",
    "countrySlug": "canada",
    "genres": [
      "Khoa Học",
      "Viễn Tưởng",
      "Hành Động",
      "Phiêu Lưu",
      "Tâm Lý"
    ],
    "director": "Gareth Edwards",
    "cast": [
      "John David Washington",
      "Madeleine Yuna Voyles",
      "Gemma Chan",
      "Allison Janney",
      "Ken Watanabe",
      "Sturgill Simpson",
      "Amar Chadha-Patel",
      "Marc Menchaca",
      "Robbie Tann",
      "Ralph Ineson",
      "Michael Esper",
      "Veronica Ngo",
      "Ian Verdun",
      "Daniel Ray Rodriguez",
      "Rad Pereira",
      "Syd Skidmore"
    ],
    "ambientColors": [
      "#ffffff",
      "#d4d4d4",
      "#a3a3a3"
    ],
    "trailerUrl": "https://www.youtube.com/watch?v=XMvMTmDYtyE",
    "synopsis": "Từ Biên kịch/Đạo diễn Gareth Edwards (&quot;Rogue One,&quot; &quot;Godzilla&quot;) mang đến một bộ phim hành động viễn tưởng lấy bối cảnh cuộc chiến trong tương lai giữa loài người và trí tuệ nhân tạo. Joshua, một cựu đặc vụ đang đau buồn trước sự mất tích của người vợ, được thuê để tiêu diệt Creator, kẻ đã đứng sau phát triển một loại vũ khí có sức mạnh chấm dứt mọi cuộc chiến và sự sống của toàn thể nhân loại. Joshua và nhóm đặc vụ tinh nhuệ đã lần theo dấu vết tiến vào lãnh thổ bị A.I chiếm đóng, chỉ để khám phá ra vũ khí hủy diệt thế giới mà anh ta được giao tiêu diệt là một A.I dưới hình hài của một đứa trẻ.",
    "episodes": [
      {
        "name": "Full",
        "slug": "full",
        "source": "https://s6.kkphimplayer6.com/20251010/cNiLF7OZ/index.m3u8"
      }
    ],
    "sourceSite": "kkphim"
  },
  {
    "id": "pa-nguoi-may-troi-day",
    "slug": "nguoi-may-troi-day",
    "crawlSlug": "nguoi-may-troi-day",
    "title": "Người Máy Trỗi Dậy",
    "originTitle": "Ex Machina",
    "poster": "https://phimimg.com/upload/vod/20231026-1/6154722fdafdf3d65ee58321cc8bef36.jpg",
    "backdrop": "https://phimimg.com/upload/vod/20231026-1/9a8ecc565dd764bbc35f49a6be94b533.jpg",
    "type": "single",
    "sectionTags": [
      "hot",
      "vietsub",
      "ai",
      "phim-le"
    ],
    "quality": "HD",
    "language": "Vietsub",
    "duration": "108 phút",
    "episodeCurrent": "Full",
    "episodeTotal": 1,
    "year": 2015,
    "rating": 9.4,
    "matchScore": 98,
    "country": "Anh",
    "countrySlug": "anh",
    "genres": [
      "Chính Kịch",
      "Khoa Học",
      "Viễn Tưởng"
    ],
    "director": "Alex Garland",
    "cast": [
      "Domhnall Gleeson",
      "Alicia Vikander",
      "Oscar Isaac",
      "Sonoya Mizuno",
      "Corey Johnson",
      "Claire Selby",
      "Symara A. Templeman",
      "Gana Bayarsaikhan",
      "Tiffany Pisani",
      "Elina Alminas",
      "Chelsea Li",
      "Dan Pappaspanos"
    ],
    "ambientColors": [
      "#ffffff",
      "#d4d4d4",
      "#a3a3a3"
    ],
    "trailerUrl": "",
    "synopsis": "Caleb, một lập trình viên 26 tuổi làm việc tại một công ty internet lớn nhất thế giới, chiến thắng một cuộc thi dành lấy một tuần tu nghiệp thuộc Nathan. Nhưng khi Caleb đến, anh thấy rằng anh sẽ phải tham gia vào một thí nghiệm kỳ lạ và hấp dẫn. Trong đó, anh phải làm việc với trí tuệ nhân tạo (A.I) thực sự đầu tiên của thế giới, nó nằm trong cơ thể của robot mang hình hài môt cô gái xinh đẹp.",
    "episodes": [
      {
        "name": "Full",
        "slug": "full",
        "source": "https://s2.phim1280.tv/20231028/EtMSfAys/index.m3u8"
      }
    ],
    "sourceSite": "kkphim"
  },
  {
    "id": "pa-ai-tri-tue-nhan-tao",
    "slug": "ai-tri-tue-nhan-tao",
    "crawlSlug": "ai-tri-tue-nhan-tao",
    "title": "AI – Trí Tuệ Nhân Tạo",
    "originTitle": "A.I. Artificial Intelligence",
    "poster": "https://phimimg.com/upload/vod/20240220-1/fb1ce6de20885fc632452ccd0c1069aa.jpg",
    "backdrop": "https://phimimg.com/upload/vod/20240220-1/85da021b9a13d802c226cdf4a3f1b393.jpg",
    "type": "single",
    "sectionTags": [
      "hot",
      "vietsub",
      "ai",
      "phim-le"
    ],
    "quality": "HD",
    "language": "Vietsub",
    "duration": "146 phút",
    "episodeCurrent": "Full",
    "episodeTotal": 1,
    "year": 2001,
    "rating": 9.4,
    "matchScore": 98,
    "country": "Âu Mỹ",
    "countrySlug": "au-my",
    "genres": [
      "Viễn Tưởng",
      "Khoa Học"
    ],
    "director": "",
    "cast": [],
    "ambientColors": [
      "#ffffff",
      "#d4d4d4",
      "#a3a3a3"
    ],
    "trailerUrl": "",
    "synopsis": "Trong tương lai không xa, mũ đá cực đã tan chảy và sự trỗi dậy của vùng biển đại dương đã nhấn chìm tất cả các thành phố ven biển trên thế giới. Rút tiền vào nội địa của các lục địa, loài người tiếp tục tiến lên, đạt đến điểm tạo ra robot thực tế (được gọi là mechas) để phục vụ họ. Một trong những công ty sản xuất Mecha xây dựng David, một đứa trẻ nhân tạo là người đầu tiên có cảm xúc thực sự, đặc biệt là một tình yêu không bao giờ kết thúc dành cho Mẹ, Monica. Monica là người phụ nữ nhận nuôi anh ta thay thế cho con trai thực sự của cô ấy, người vẫn ở Cryo-Stasis, bị mắc kẹt bởi một căn bệnh nan y. David đang sống hạnh phúc với Monica và chồng, nhưng khi con trai thực sự của họ trở về nhà sau khi chữa trị được phát hiện, cuộc sống của anh ta thay đổi đáng kể",
    "episodes": [
      {
        "name": "Full",
        "slug": "full",
        "source": "https://s2.phim1280.tv/20240302/HSaryiWp/index.m3u8"
      }
    ],
    "sourceSite": "kkphim"
  },
  {
    "id": "pa-toi-pham-nhan-ban-2049",
    "slug": "toi-pham-nhan-ban-2049",
    "crawlSlug": "toi-pham-nhan-ban-2049",
    "title": "Tội Phạm Nhân Bản 2049",
    "originTitle": "Blade Runner 2049",
    "poster": "https://phimimg.com/upload/vod/20250526-1/c2f16d5873f9bbd24c6c951ff88bf1b9.jpg",
    "backdrop": "https://phimimg.com/upload/vod/20250526-1/47cf1c718a533e0e05b24ad2c99da768.jpg",
    "type": "single",
    "sectionTags": [
      "hot",
      "vietsub",
      "ai",
      "phim-le"
    ],
    "quality": "FHD",
    "language": "Vietsub",
    "duration": "164 phút",
    "episodeCurrent": "Full",
    "episodeTotal": 1,
    "year": 2017,
    "rating": 9.4,
    "matchScore": 98,
    "country": "Canada",
    "countrySlug": "canada",
    "genres": [
      "Khoa Học",
      "Viễn Tưởng",
      "Chính Kịch"
    ],
    "director": "Denis Villeneuve",
    "cast": [
      "Ryan Gosling",
      "Harrison Ford",
      "Ana de Armas",
      "Dave Bautista",
      "Robin Wright",
      "Sylvia Hoeks",
      "Mackenzie Davis",
      "Jared Leto",
      "Carla Juri",
      "Hiam Abbass",
      "Lennie James",
      "David Dastmalchian",
      "Sean Young",
      "Edward James Olmos",
      "Barkhad Abdi",
      "Wood Harris",
      "Tómas Lemarquis",
      "Salli"
    ],
    "ambientColors": [
      "#ffffff",
      "#d4d4d4",
      "#a3a3a3"
    ],
    "trailerUrl": "https://www.youtube.com/watch?v=geFtxCSz8xI",
    "synopsis": "Một chàng trai trẻ khám phá ra bí mật khiến xã hội rơi vào cảnh hỗn mang. Anh lên đường đi tìm một người khác đã mất tích cách đây ba mươi năm, để rồi cả hai cùng bước vào hành trình cứu thế giới. 35 năm sau ngày phần đầu tiên ra mắt, Blade Runner trở lại với những gương mặt mới, câu chuyện mới, đầy hứa hẹn vẫn sẽ giữ được cái “chất” khiến thương hiệu này trở thành tác phẩm kinh điển trong lịch sử điện ảnh. Nhà sản xuất vừa tung ra trailer đầu tiên của phim do bộ đôi Ridley Scott - sản xuất và Denis Villeneuve - đạo diễn với vô số tình tiết bất ngờ có thể hứa hẹn đây là sẽ bom tấn đáng để chúng ta ra rạp thưởng thức. Phim được xem là tác phẩm kinh điển của thể loại khoa học viễn tưởng.",
    "episodes": [
      {
        "name": "Full",
        "slug": "full",
        "source": "https://s6.kkphimplayer6.com/20250525/M8S1sKG4/index.m3u8"
      }
    ],
    "sourceSite": "kkphim"
  },
  {
    "id": "pa-toi-pham-nhan-ban",
    "slug": "toi-pham-nhan-ban",
    "crawlSlug": "toi-pham-nhan-ban",
    "title": "Tội Phạm Nhân Bản",
    "originTitle": "Blade Runner",
    "poster": "https://phimimg.com/upload/vod/20231020-1/2ce10643cc72a99eeec844b23225e385.jpg",
    "backdrop": "https://phimimg.com/upload/vod/20231020-1/d6ba2c7eb0a3f8960e3628448c0a53a5.jpg",
    "type": "single",
    "sectionTags": [
      "hot",
      "vietsub",
      "ai",
      "phim-le"
    ],
    "quality": "HD",
    "language": "Vietsub",
    "duration": "118 phút",
    "episodeCurrent": "Full",
    "episodeTotal": 1,
    "year": 1982,
    "rating": 9.4,
    "matchScore": 98,
    "country": "Âu Mỹ",
    "countrySlug": "au-my",
    "genres": [
      "Khoa Học",
      "Chính Kịch",
      "Tâm Lý",
      "Viễn Tưởng"
    ],
    "director": "Ridley Scott",
    "cast": [
      "Harrison Ford",
      "Rutger Hauer",
      "Sean Young",
      "Edward James Olmos",
      "M. Emmet Walsh",
      "Daryl Hannah",
      "William Sanderson",
      "Brion James",
      "Joe Turkel",
      "Joanna Cassidy",
      "James Hong",
      "Kevin Thompson",
      "Hy Pyke",
      "Kimiko Hiroshige",
      "Ben Astar",
      "Dawna Lee Heising",
      "Alexis Rhee",
      "Bob Ok"
    ],
    "ambientColors": [
      "#ffffff",
      "#d4d4d4",
      "#a3a3a3"
    ],
    "trailerUrl": "",
    "synopsis": "Blade Runner lấy bối cảnh thế giới tương lai, nơi ô nhiễm môi trường, khủng hoảng lương thực khiến cuộc sống của con người trở thành địa ngục. Để thoát khỏi diệt vong, nhân loại tiến hành khai phá các hành tinh khác trong vũ trụ để thành lập thuộc địa. Họ sử dụng người nhân bản do Eldon Tyrell chế tạo làm nguồn lao động chính. Người nhân bản được tạo ra rất giống với con người, có cảm xúc, suy nghĩ nhưng có tuổi thọ nhất định ở một số phiên bản. Blade Runner là lực lượng cảnh sát được thành lập để săn đuổi và tiêu diệt những người nhân bản lẩn trốn trên trái đất. Trong phần này, các Blade Runner đều là con người. Sang phần phim Blade Runner 2049, các Nexus-9 cũng được tham gia lực lượng này.",
    "episodes": [
      {
        "name": "Full",
        "slug": "full",
        "source": "https://s1.phim1280.tv/20231022/Kx5nJkFb/index.m3u8"
      }
    ],
    "sourceSite": "kkphim"
  },
  {
    "id": "pa-chappie",
    "slug": "chappie",
    "crawlSlug": "chappie",
    "title": "Chappie",
    "originTitle": "Chappie",
    "poster": "https://phimimg.com/upload/vod/20231021-1/2d480d6025099bd105d8b103981ce013.jpg",
    "backdrop": "https://phimimg.com/upload/vod/20231021-1/5ba2bd440e4f5903f32d0f6b66c5e821.jpg",
    "type": "single",
    "sectionTags": [
      "hot",
      "vietsub",
      "ai",
      "phim-le"
    ],
    "quality": "HD",
    "language": "Vietsub",
    "duration": "120 phút",
    "episodeCurrent": "Full",
    "episodeTotal": 1,
    "year": 2015,
    "rating": 9.4,
    "matchScore": 98,
    "country": "Âu Mỹ",
    "countrySlug": "au-my",
    "genres": [
      "Hình Sự",
      "Hành Động",
      "Khoa Học",
      "Viễn Tưởng"
    ],
    "director": "Neill Blomkamp",
    "cast": [
      "Sharlto Copley",
      "Dev Patel",
      "Hugh Jackman",
      "Ninja",
      "Yo-Landi Visser",
      "Sigourney Weaver",
      "Chris Shields",
      "Anderson Cooper",
      "Jose Pablo Cantillo",
      "Brandon Auret",
      "Johnny Selema",
      "Maurice Carpede",
      "Jason Cope",
      "Kevin Otto",
      "Bill Marchant",
      "Robert Hobbs",
      "Eugene Khumbanyiwa"
    ],
    "ambientColors": [
      "#ffffff",
      "#d4d4d4",
      "#a3a3a3"
    ],
    "trailerUrl": "",
    "synopsis": "Bộ phim Chappie xoay quanh câu chuyện về một chú robot của lực lượng cảnh sát Johannesburg, bị hỏng sau một trận đánh, Chappie được một nhà khoa học trẻ khôi phục lại và “thổi hồn” vào biến cậu thành khác biệt. Chappie có linh hồn, có tình cảm và có suy nghĩ như một con người. Ẩn trong vẻ ngoài lạnh lùng cứng nhắc của một robot cảnh sát, linh hồn Chappie non nớt và ngây thơ như một đứa trẻ. Và hơn bao giờ hết, cậu có một niềm thiết tha mãnh liệt với cuộc sống.",
    "episodes": [
      {
        "name": "Full",
        "slug": "full",
        "source": "https://s2.phim1280.tv/20231022/k63SYGvE/index.m3u8"
      }
    ],
    "sourceSite": "kkphim"
  },
  {
      "id": "mai-2024",
      "slug": "mai-2024",
      "crawlSlug": "mai-2024",
      "title": "Mai",
      "originTitle": "Mai",
      "poster": "https://phimimg.com/upload/vod/20240423-1/7b281d88350fd638d84dc9abb5b6b0a6.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20240423-1/afb71c134b82ad08f21b8d9127c70fc6.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietnam",
          "chieu-rap"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "131 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2024,
      "rating": 9.4,
      "matchScore": 98,
      "country": "Việt Nam",
      "countrySlug": "viet-nam",
      "genres": [
          "Chiếu Rạp",
          "Tình Cảm",
          "Chính Kịch"
      ],
      "director": "Trấn Thành",
      "cast": [
          "Phương Anh Đào",
          "Tuấn Trần",
          "Trấn Thành",
          "Hồng Đào",
          "Uyển Ân",
          "Ngọc Giàu"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=EX6clvId19s",
      "synopsis": "MAI xoay quanh câu chuyện về cuộc đời của một người phụ nữ cùng tên với bộ phim. Trên First-look Poster, Phương Anh Đào tạo ấn tượng mạnh với cái nhìn tĩnh lặng, xuyên thấu, đặc biệt, trên bờ môi nữ diễn viên là hình ảnh cô đang nằm nghiêng trên mặt nước. Được phủ một màn sương mờ ảo, poster đậm chất nghệ thuật của Mai...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s3.phim1280.tv/20240517/kHTjz9g4/index.m3u8"
          }
      ]
  },
  {
      "id": "lat-mat-6-tam-ve-dinh-menh",
      "slug": "lat-mat-6-tam-ve-dinh-menh",
      "crawlSlug": "lat-mat-6-tam-ve-dinh-menh",
      "title": "Lật Mặt 6: Tấm Vé Định Mệnh",
      "originTitle": "Face Off 6: The Ticket Of Destiny",
      "poster": "https://phimimg.com/upload/vod/20240919-1/5c666eeb1ce5b80a0140906109da9d2a.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20240919-1/04dc2a0a9dbc3efbb6289dec6349de9e.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietnam",
          "chieu-rap"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "132 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2023,
      "rating": 9.4,
      "matchScore": 98,
      "country": "Việt Nam",
      "countrySlug": "viet-nam",
      "genres": [
          "Chiếu Rạp",
          "Hành Động",
          "Chính Kịch",
          "Tâm Lý"
      ],
      "director": "Lý Hải",
      "cast": [
          "Trung Dũng",
          "Huy Khánh",
          "Quốc Cường",
          "Tiết Cương",
          "Huỳnh Thi",
          "Thanh Thức"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=L-XhraxUsAs",
      "synopsis": "Một nhóm bạn thân lâu năm bất ngờ nhận được cơ hội đổi đời &nbsp;khi biết tấm vé của cả nhóm trúng giải độc đắc 136.8 tỷ. Đột nhiên An, người nắm giữ tấm vé bất ngờ gặp tai nạn không qua khỏi. Đứng trước món tiền trúng số đáng mơ ước lẽ ra sẽ dễ dàng có được trong tầm tay, nhóm bạn bước chân vào hành trình đi tìm tờ vé...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s4.phim1280.tv/20240918/HifizysW/index.m3u8"
          }
      ]
  },
  {
      "id": "nha-ba-nu",
      "slug": "nha-ba-nu",
      "crawlSlug": "nha-ba-nu",
      "title": "Nhà Bà Nữ",
      "originTitle": "The House Of No Man",
      "poster": "https://phimimg.com/upload/vod/20230922-1/8e7ee122a3ca993f858a005ab9b8211d.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20230922-1/d2cfd0e655a35fd296702ab53226061e.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietnam",
          "chieu-rap"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "103 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2023,
      "rating": 9.4,
      "matchScore": 98,
      "country": "Việt Nam",
      "countrySlug": "viet-nam",
      "genres": [
          "Chiếu Rạp",
          "Chính Kịch",
          "Hài Hước"
      ],
      "director": "Trấn Thành",
      "cast": [
          "Uyen An",
          "Song Luân",
          "Lê Giang",
          "Khả Như",
          "Trấn Thành",
          "Ngọc Giàu"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=IkaP0KJWTsQ",
      "synopsis": "<span style=\"font-family: \">Câu chuyện xoay quanh gia đình bà Nữ gồm ba thế hệ sống cùng nhau trong một ngôi nhà. Bà Nữ một tay cáng đáng mọi sự, nổi tiếng với quán bánh canh cua và cũng khét tiếng với việc kiểm soát cuộc sống của tất cả mọi người, từ con gái đến con rể. Mọi chuyện diễn ra bình thường cho đến khi cô co...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s2.phim1280.tv/20230923/z3jgK5cd/index.m3u8"
          }
      ]
  },
  {
      "id": "bo-gia-2021",
      "slug": "bo-gia-2021",
      "crawlSlug": "bo-gia-2021",
      "title": "Bố Già",
      "originTitle": "Dad, I'm Sorry",
      "poster": "https://phimimg.com/upload/vod/20250119-1/78ea9e50373b3ac2e51a8fa6b147984f.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20250119-1/f42aefe12ee48db50ee7c465efb85798.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietnam",
          "chieu-rap"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "128 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2021,
      "rating": 9.4,
      "matchScore": 98,
      "country": "Việt Nam",
      "countrySlug": "viet-nam",
      "genres": [
          "Chiếu Rạp",
          "Hài Hước",
          "Gia Đình",
          "Chính Kịch"
      ],
      "director": "Trấn Thành, Vũ Ngọc Đãng",
      "cast": [
          "Trấn Thành",
          "Tuấn Trần",
          "Ngân Chi",
          "Ngọc Giàu",
          "Lê Giang"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=jluSu8Rw6YE",
      "synopsis": "Câu chuyện về Ba Sang - con thứ hai trong 4 anh em ồn ào: Giàu, Sang, Phú, Quý. Ba Sang là một người ga lăng, “quá” tốt bụng và luôn hy sinh vì người khác dù họ có muốn hay không. Quân - Ba Sang’s son là một Youtuber trẻ hiện đại....",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s4.phim1280.tv/20250119/FdJUVZy5/index.m3u8"
          }
      ]
  },
  {
      "id": "mat-biec",
      "slug": "mat-biec",
      "crawlSlug": "mat-biec",
      "title": "Mắt Biếc",
      "originTitle": "Dreamy Eyes",
      "poster": "https://phimimg.com/upload/vod/20240922-1/9d181d0abdf6531f1792bb0eb85e3042.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20240922-1/01e44fb6676ad954648b7e6104b63767.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietnam",
          "chieu-rap"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "117 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2019,
      "rating": 9.4,
      "matchScore": 98,
      "country": "Việt Nam",
      "countrySlug": "viet-nam",
      "genres": [
          "Chiếu Rạp",
          "Chính Kịch",
          "Tình Cảm"
      ],
      "director": "Victor Vũ",
      "cast": [
          "Trúc Anh",
          "Trần Nghĩa",
          "Đỗ Khánh Vân",
          "Trần Phong",
          "Nguyễn Lâm Thảo Tâm"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=ITlQ0oU7tDA",
      "synopsis": "Đạo diễn Victor Vũ trở lại với một tác phẩm chuyển thể từ truyện ngắn cùng tên nổi tiếng của nhà văn Nguyễn Nhật Ánh: Mắt Biếc. Phim kể về chuyện tình đơn phương của chàng thanh niên Ngạn dành cho cô bạn từ thuở nhỏ Hà Lan....",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s4.phim1280.tv/20240922/IHLn2YwS/index.m3u8"
          }
      ]
  },
  {
      "id": "tiec-trang-mau",
      "slug": "tiec-trang-mau",
      "crawlSlug": "tiec-trang-mau",
      "title": "Tiệc Trăng Máu",
      "originTitle": "Blood Moon Party",
      "poster": "https://phimimg.com/upload/vod/20260123-1/978e6060f811ed9903c2c1e2f9b6f4f0.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20260123-1/a99ede8e342b97387a282cffd66746ae.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietnam",
          "chieu-rap"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "118 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2020,
      "rating": 9.4,
      "matchScore": 98,
      "country": "Việt Nam",
      "countrySlug": "viet-nam",
      "genres": [
          "Chiếu Rạp",
          "Hài Hước",
          "Chính Kịch",
          "Tâm Lý"
      ],
      "director": "Nguyễn Quang Dũng",
      "cast": [
          "Thái Hòa",
          "Hồng Ánh",
          "Hứa Vĩ Văn",
          "Thu Trang",
          "Kiều Minh Tuấn",
          "Kaity Nguyễn"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=PqNGHKLyPD0",
      "synopsis": "Trong buổi họp mặt của nhóm bạn thân, một thành viên bất ngờ đề xuất trò chơi chia sẻ điện thoại nhằm tăng tinh thần “đoàn kết”. Từ đó, những góc khuất của từng người dần hé lộ và khiến cho mối quan hệ vốn khắng khít của họ bắt đầu lay chuyển....",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s6.kkphimplayer6.com/20260123/XNNQdd7w/index.m3u8"
          }
      ]
  },
  {
      "id": "hai-phuong",
      "slug": "hai-phuong",
      "crawlSlug": "hai-phuong",
      "title": "Hai Phượng",
      "originTitle": "Hai Phượng",
      "poster": "https://phimimg.com/upload/vod/20230917-1/7e4c2ad600ac6d37b8397c39744003f1.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20230917-1/510f39527bcc07538cc1a163128c40a5.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietsub",
          "au-my",
          "netflix"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "98 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2019,
      "rating": 9.2,
      "matchScore": 98,
      "country": "Quốc Gia Khác",
      "countrySlug": "quoc-gia-khac",
      "genres": [
          "Hành Động",
          "Chính Kịch",
          "Tâm Lý"
      ],
      "director": "Le Van Kiet",
      "cast": [
          "Veronica Ngo",
          "Phan Thanh Nhien",
          "Phạm Anh Khoa",
          "Thanh Hoa",
          "Mai Cat Vi",
          "Le Trang"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "",
      "synopsis": "<span style=\"font-family: \">Hai Phượng kể về cuộc hành trình đầy gay cấn và gian của khi người mẹ vùng quê tìm cách cứu con mình thoát khỏi đường dây bắt cóc khổng lồ. Không tấc sắc trong tay, người phụ nữ thân cô thế cô làm sao chống lại bọn xã hội đen tàn ác để giành lại nguồn sống của đời mình?</span><br/>...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s2.phim1280.tv/20230917/pGzc51S6/index.m3u8"
          }
      ]
  },
  {
      "id": "gap-lai-chi-bau",
      "slug": "gap-lai-chi-bau",
      "crawlSlug": "gap-lai-chi-bau",
      "title": "Gặp Lại Chị Bầu",
      "originTitle": "Gặp Lại Chị Bầu",
      "poster": "https://phimimg.com/upload/vod/20240428-1/56a42ba13865a39e71ef4bec9bf066e5.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20240428-1/9209ac428fbbd24bb065a94ec3ef0fc7.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietnam",
          "chieu-rap"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "114 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2024,
      "rating": 9.4,
      "matchScore": 98,
      "country": "Việt Nam",
      "countrySlug": "viet-nam",
      "genres": [
          "Chiếu Rạp",
          "Hài Hước",
          "Chính Kịch",
          "Gia Đình"
      ],
      "director": "Nhất Trung",
      "cast": [
          "Diệu Nhi",
          "Anh Tú",
          "Lê Giang",
          "Quốc Khánh",
          "Ngọc Phước",
          "Kiều Minh Tuấn"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=Gggw9jwr1h4",
      "synopsis": "“Gặp Lại Chị Bầu” xoay quanh Phúc, một thanh viên trẻ với đam mê diễn xuất nhưng phải trải qua cuộc sống muôn vàn khó khăn. Anh tình cờ lưu lạc đến xóm trọ của bà Lê và cùng những người bạn ở đây trải qua những ngày tháng thanh xuân đáng nhớ nhất cuộc đời....",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s3.phim1280.tv/20240428/xRZkP8kh/index.m3u8"
          }
      ]
  },
  {
      "id": "quy-cau",
      "slug": "quy-cau",
      "crawlSlug": "quy-cau",
      "title": "Quỷ Cẩu",
      "originTitle": "Crimson Snout",
      "poster": "https://phimimg.com/upload/vod/20240322-1/58433028cb27b24a08795cce603c8a36.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20240322-1/fc17321c17a27bd34865d93ac404e22f.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietnam",
          "chieu-rap"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "99 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2023,
      "rating": 9.4,
      "matchScore": 98,
      "country": "Việt Nam",
      "countrySlug": "viet-nam",
      "genres": [
          "Chiếu Rạp",
          "Kinh Dị"
      ],
      "director": "Lưu Thành Luân",
      "cast": [
          "Ngô Quang Tuấn",
          "Kim Xuân",
          "Vân Dung",
          "Nam Thư"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=Cswx649vXVw",
      "synopsis": "Quỷ Cẩu kể về một gia đình làm nghề mổ chó....",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s3.phim1280.tv/20240322/rh7CA2Yi/index.m3u8"
          }
      ]
  },
  {
      "id": "lam-giau-voi-ma",
      "slug": "lam-giau-voi-ma",
      "crawlSlug": "lam-giau-voi-ma",
      "title": "Làm Giàu Với Ma",
      "originTitle": "Betting With Ghost",
      "poster": "https://phimimg.com/upload/vod/20250323-1/1b5a22c27996cde1f32b19c449853063.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20250323-1/5c8b4a2c724d8cbee887c0b90767633d.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietnam",
          "chieu-rap"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "113 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2024,
      "rating": 9.4,
      "matchScore": 98,
      "country": "Việt Nam",
      "countrySlug": "viet-nam",
      "genres": [
          "Chiếu Rạp",
          "Hài Hước",
          "Gia Đình",
          "Kinh Dị"
      ],
      "director": "Nhật Trung",
      "cast": [
          "Tuấn Trần",
          "Diệp Bảo Ngọc",
          "Hoài Linh",
          "Lê Giang",
          "La Thành",
          "Quang Minh"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=MtZ_hf7tLxk",
      "synopsis": "Trong Làm Giàu Với Ma, Tuấn Trần vào vai Lanh - một thanh niên lêu lổng, ngỗ ngược, dính vào cờ bạc nợ nần. Trên quãng đường chạy trốn khỏi đám giang hồ chủ nợ hung hăng, anh vô tình &quot;đụng&quot; phải ma nữ Na (Diệp Bảo Ngọc) và bị cô nàng nhờ vả giúp mình tìm gặp đứa con mà cô đã phải lìa xa từ lúc chào đời. Đổi l...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s6.kkphimplayer6.com/20250814/7EdgqAni/index.m3u8"
          }
      ]
  },
  {
      "id": "dat-rung-phuong-nam",
      "slug": "dat-rung-phuong-nam",
      "crawlSlug": "dat-rung-phuong-nam",
      "title": "Đất Rừng Phương Nam",
      "originTitle": "Song of the South",
      "poster": "https://phimimg.com/upload/vod/20240319-1/72195bc6fd8ffa3063dc86ec088b6ffb.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20240319-1/cb60138b0d4e4e8c7f8a7aaa8eb868ec.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietnam",
          "chieu-rap"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "100 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2023,
      "rating": 9.4,
      "matchScore": 98,
      "country": "Việt Nam",
      "countrySlug": "viet-nam",
      "genres": [
          "Chiếu Rạp",
          "Chiến Tranh",
          "Gia Đình",
          "Chính Kịch"
      ],
      "director": "Nguyễn Quang Dũng",
      "cast": [
          "Trấn Thành",
          "Công Ninh",
          "Hồng Ánh",
          "Mai Tài Phến",
          "Tuấn Trần",
          "Tuyền Mập"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=hktzirCnJmQ",
      "synopsis": "Đất Rừng Phương Nam phiên bản điện ảnh được kế thừa và phát triển từ tiểu thuyết cùng tên của nhà văn Đoàn Giỏi. Bộ phim kể về hành trình phiêu lưu của An - một cậu bé chẳng may mất mẹ trên đường đi tìm cha. Cùng với An, khán giả sẽ trải nghiệm sự trù phú của thiên nhiên và nét đẹp văn hoá đặc sắc của vùng đất Nam Kì L...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s3.phim1280.tv/20240319/ym2SFUf0/index.m3u8"
          }
      ]
  },
  {
      "id": "nguoi-vo-cuoi-cung",
      "slug": "nguoi-vo-cuoi-cung",
      "crawlSlug": "nguoi-vo-cuoi-cung",
      "title": "Người Vợ Cuối Cùng",
      "originTitle": "The Last Wife",
      "poster": "https://phimimg.com/upload/vod/20240205-1/67945e7f327a89d07fa2d75ee119c475.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20240205-1/0f3ced15c8df776166d1268e26aac241.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietnam",
          "chieu-rap"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "133 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2023,
      "rating": 9.4,
      "matchScore": 98,
      "country": "Việt Nam",
      "countrySlug": "viet-nam",
      "genres": [
          "Chiếu Rạp",
          "Chính Kịch",
          "Tình Cảm"
      ],
      "director": "Victor Vũ",
      "cast": [
          "Kaity Nguyễn",
          "Thuận Nguyễn",
          "Quốc Huy",
          "De Ly Luu",
          "Ngọc Diệp",
          "Nguyen Anh Dung"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=RhlCD8FAs08",
      "synopsis": "Lấy cảm hứng từ tiểu thuyết Hồ Oán Hận, của nhà văn Hồng Thái, Người Vợ Cuối Cùng là một bộ phim tâm lý cổ trang, lấy bối cảnh Việt Nam vào triều Nguyễn. &nbsp;LINH - Người vợ bất đắc dĩ của một viên quan tri huyện, xuất thân là con của một gia đình nông dân nghèo khó, vì không thể hoàn thành nghĩa vụ sinh con nối dõi ...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s2.phim1280.tv/20240205/sxwdzFCr/index.m3u8"
          }
      ]
  },
  {
      "id": "cong-tu-bac-lieu",
      "slug": "cong-tu-bac-lieu",
      "crawlSlug": "cong-tu-bac-lieu",
      "title": "Công Tử Bạc Liêu",
      "originTitle": "Once Upon A Time In Indochine",
      "poster": "https://phimimg.com/upload/vod/20250403-1/2598439800e1d56a3ab37ed88160a364.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20250403-1/6cc48ac44f9e5bd02a3b4c2301865d9e.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietnam",
          "chieu-rap"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "106 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2024,
      "rating": 9.4,
      "matchScore": 98,
      "country": "Việt Nam",
      "countrySlug": "viet-nam",
      "genres": [
          "Chiếu Rạp",
          "Gia Đình",
          "Hài Hước",
          "Tình Cảm",
          "Tâm Lý"
      ],
      "director": "Lý Minh Thắng",
      "cast": [
          "Song Luân",
          "Kaity Nguyễn",
          "Thành Lộc",
          "Hữu Châu",
          "Thanh Thủy",
          "Công Dương"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=7oVbS8zQxQ0",
      "synopsis": "Lấy bối cảnh thập niên 1930, bộ phim là câu chuyện kể về một nhân vật ăn chơi bậc nhất Nam Kỳ lục tỉnh thời bấy giờ, Công tử Bạc Liêu Trần Đắc Hơn, với những giai thoại nổi tiếng như đốt tiền nấu chè, đấu xảo sắc đẹp, v.v... &nbsp;Dù là một người có tư tưởng cấp tiến Tây học, luôn thích phá cách và làm trái ngược lại n...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s4.phim1280.tv/20250403/ppubHKkA/index.m3u8"
          }
      ]
  },
  {
      "id": "ngay-xua-co-mot-chuyen-tinh",
      "slug": "ngay-xua-co-mot-chuyen-tinh",
      "crawlSlug": "ngay-xua-co-mot-chuyen-tinh",
      "title": "Ngày Xưa Có Một Chuyện Tình",
      "originTitle": "Once Upon A Love Story",
      "poster": "https://phimimg.com/upload/vod/20250901-1/e8b2e71c237e7dbbee1c014091f44351.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20250901-1/377ca3402a12c55372f0145f49c0e4a5.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietnam",
          "chieu-rap"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "135 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2024,
      "rating": 9.4,
      "matchScore": 98,
      "country": "Việt Nam",
      "countrySlug": "viet-nam",
      "genres": [
          "Chiếu Rạp",
          "Tình Cảm",
          "Chính Kịch",
          "Tâm Lý"
      ],
      "director": "Trinh Dinh Le Minh",
      "cast": [
          "Ngọc Xuân",
          "Lương Anh Vũ",
          "Đỗ Nhật Hoàng",
          "Hạo Khang",
          "Rima Thanh Vy",
          "Kiều Trinh"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=wGMq-JNTxC4",
      "synopsis": "Ngày Xưa Có Một Chuyện Tình xoay quanh câu chuyện tình bạn, tình yêu giữa hai chàng trai và một cô gái từ thuở ấu thơ cho đến khi trưởng thành, phải đối mặt với những thử thách của số phận. Trải dài trong 4 giai đoạn từ năm 1987 - 2000, ba người bạn cùng tuổi - Vinh, Miền, Phúc đã cùng yêu, cùng bỡ ngỡ bước vào đời, va...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s6.kkphimplayer6.com/20250901/w8LN0LND/index.m3u8"
          }
      ]
  },
  {
      "id": "sieu-lua-gap-sieu-lay",
      "slug": "sieu-lua-gap-sieu-lay",
      "crawlSlug": "sieu-lua-gap-sieu-lay",
      "title": "Siêu Lừa Gặp Siêu Lầy",
      "originTitle": "Hustler vs Scammer",
      "poster": "https://phimimg.com/upload/vod/20240919-1/ef0bc57cc068af0c1b13943b7a40852f.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20240919-1/5489fae29d34ab2c8c116e2417f06fc0.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietnam",
          "chieu-rap"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "112 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2023,
      "rating": 9.4,
      "matchScore": 98,
      "country": "Việt Nam",
      "countrySlug": "viet-nam",
      "genres": [
          "Chiếu Rạp",
          "Hài Hước",
          "Hành Động"
      ],
      "director": "Võ Thanh Hòa",
      "cast": [
          "Mạc Văn Khoa",
          "Anh Tú",
          "Ngọc Phước",
          "Nhật Trung",
          "Mỹ Duyên",
          "Đại Nghĩa"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=rCfgqxLwT20",
      "synopsis": "Siêu Lừa Gặp Siêu Lầy của đạo diễn Võ Thanh Hòa theo chân của Khoa – tên lừa đảo tầm cỡ “quốc nội” đến đảo ngọc Phú Quốc với mong muốn đổi đời. Tại đây, Khoa gặp Tú – tay lừa đảo “hàng real” và cùng Tú thực hiện các phi vụ từ nhỏ đến lớn. Cứ ngỡ sự ranh mãnh của Tú và sự may mắn trời cho của Khoa sẽ giúp họ trở thành b...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s4.phim1280.tv/20240918/PoxPC7NH/index.m3u8"
          }
      ]
  },
  {
      "id": "em-chua-18",
      "slug": "em-chua-18",
      "crawlSlug": "em-chua-18",
      "title": "Em Chưa 18",
      "originTitle": "Jailbait",
      "poster": "https://phimimg.com/upload/vod/20250511-1/decf910fa32aa518174b9afc50ea32c3.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20250511-1/1647db994439f2622914335845539019.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietnam",
          "chieu-rap"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "90 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2017,
      "rating": 9.4,
      "matchScore": 98,
      "country": "Việt Nam",
      "countrySlug": "viet-nam",
      "genres": [
          "Chiếu Rạp",
          "Chính Kịch",
          "Hài Hước"
      ],
      "director": "Lê Thanh Sơn",
      "cast": [
          "Kaity Nguyễn",
          "Kiều Minh Tuấn",
          "Will",
          "Nguyễn Tiến Dũng",
          "Châu Bùi",
          "Kiều Trinh"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=_affkHceSj4",
      "synopsis": "Câu chuyện bắt đầu với Hoàng, một Tay chơi “chất lầy” bảnh tỏn, thu nhập ngất ngưởng, sống cùng quy luật &quot;không có đêm thứ 2&quot; với bất kỳ cô nàng nào. Định mệnh ập đến khi chàng trai trong mơ của bao người đàn ông gặp gỡ Linh Đan. Dĩ nhiên, cả hai đã có mối tình chớp nhoáng và không hề có gì khác biệt với nhữn...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s5.phim1280.tv/20250511/6Ul5lCUK/index.m3u8"
          }
      ]
  },
  {
      "id": "cam",
      "slug": "cam",
      "crawlSlug": "cam",
      "title": "Cám",
      "originTitle": "The Sisters",
      "poster": "https://phimimg.com/upload/vod/20250302-1/95297d8023e0e6cca061455cdc22cef0.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20250302-1/887291d6f943171d2815f048130232dd.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietnam",
          "chieu-rap"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "122 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2024,
      "rating": 9.4,
      "matchScore": 98,
      "country": "Việt Nam",
      "countrySlug": "viet-nam",
      "genres": [
          "Chiếu Rạp",
          "Kinh Dị"
      ],
      "director": "Trần Hữu Tấn",
      "cast": [
          "Lam Thanh My",
          "Rima Thanh Vy",
          "Thuý Diễm",
          "Quốc Cường",
          "Ngô Hải Nam",
          "Nguyễn Thị Ngọc Hiệp"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=wI2Wd2yA8YE",
      "synopsis": "Cám - một cô gái sinh ra với khuôn mặt dị dạng do một lời nguyền truyền qua nhiều thế hệ. Cám bị cha mình xem như một vết nhơ của gia đình và bị đày xuống nhà sau, sống như người hầu và chịu đựng sự ngược đãi. Trong khi đó, người chị cùng cha khác mẹ của cô là Tấm nhận được tình yêu thương và sự nuông chiều của cha. Mặ...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s6.kkphimplayer6.com/20250801/vdY9hlo8/index.m3u8"
          }
      ]
  },
  {
      "id": "ma-da",
      "slug": "ma-da",
      "crawlSlug": "ma-da",
      "title": "Ma Da",
      "originTitle": "The Drowning Spirit",
      "poster": "https://phimimg.com/upload/vod/20241116-1/e851bfbfc2dc5b2f9463571e5fba6734.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20241116-1/3747ec0cb2bbc3679512ef163621eefc.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietnam",
          "chieu-rap"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "95 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2024,
      "rating": 9.4,
      "matchScore": 98,
      "country": "Việt Nam",
      "countrySlug": "viet-nam",
      "genres": [
          "Chiếu Rạp",
          "Tình Cảm",
          "Chính Kịch",
          "Hài Hước"
      ],
      "director": "Nguyễn Hữu Hoàng",
      "cast": [
          "Việt Hương",
          "Dạ Chúc",
          "Trung Dân",
          "Diệu Đức",
          "Thành Lộc",
          "Cẩm Ly"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=vC-KNlLNIso",
      "synopsis": "Phim kể về hành trình của bà Lệ, người làm nghề vớt xác người chết trên sông để đưa về với gia đình. Trong quá trình làm nghề, bà Lệ đắc tội với Ma Da, một oan hồn sống dưới sông nước thường xuyên kéo chân người để thế mạng cho mình đi đầu thai. n oán của cả hai khiến cho Ma Da bắt mất bé Nhung, con gái của bà Lệ . Bà ...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s5.phim1280.tv/20241116/8EbHTuih/index.m3u8"
          }
      ]
  },
  {
      "id": "co-dau-hao-mon",
      "slug": "co-dau-hao-mon",
      "crawlSlug": "co-dau-hao-mon",
      "title": "Cô Dâu Hào Môn",
      "originTitle": "The Trophy Bride",
      "poster": "https://phimimg.com/upload/vod/20250129-1/a008a55771216663370dae5da82b7edf.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20250129-1/f24b69ffb4c24e8f28c64093de552b3a.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietnam",
          "chieu-rap"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "114 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2024,
      "rating": 9.4,
      "matchScore": 98,
      "country": "Việt Nam",
      "countrySlug": "viet-nam",
      "genres": [
          "Chiếu Rạp",
          "Chính Kịch",
          "Tình Cảm",
          "Hài Hước"
      ],
      "director": "Vũ Ngọc Đãng",
      "cast": [
          "Uyển Ân",
          "Kiều Minh Tuấn",
          "Thu Trang",
          "Samuel An",
          "Hồng Vân",
          "Lê Giang"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=QJ8E9R70csY",
      "synopsis": "Phim lấy đề tài làm dâu hào môn và khai thác câu chuyện môn đăng hộ đối, lối sống và quy tắc của giới thượng lưu dưới góc nhìn hài hước và châm biếm....",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s4.phim1280.tv/20250129/STxoYxtK/index.m3u8"
          }
      ]
  },
  {
      "id": "ke-an-hon",
      "slug": "ke-an-hon",
      "crawlSlug": "ke-an-hon",
      "title": "Kẻ Ăn Hồn",
      "originTitle": "The Soul Reaper",
      "poster": "https://phimimg.com/upload/vod/20240315-1/ae6b750d852646a5c94eb3873d5e7c78.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20240315-1/2c151504adb279ed692b550c7b7bb94b.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietnam",
          "chieu-rap"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "109 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2023,
      "rating": 9.4,
      "matchScore": 98,
      "country": "Việt Nam",
      "countrySlug": "viet-nam",
      "genres": [
          "Chiếu Rạp",
          "Kinh Dị"
      ],
      "director": "Trần Hữu Tấn",
      "cast": [
          "Hoàng Hà",
          "Võ Điền Gia Huy",
          "Huỳnh Thanh Trực",
          "Lan Phương",
          "Chiều Xuân",
          "Viết Liên"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=GMLKxb8spNI",
      "synopsis": "Kẻ Ăn Hồn - phim về hàng loạt cái chết bí ẩn ở Làng Địa Ngục, nơi có ma thuật cổ xưa: 5 mạng đổi bình Rượu Sọ Người. Thập Nương - cô gái áo đỏ là kẻ nắm giữ bí thuật luyện nên loại rượu mạnh nhất! &nbsp;Diễn viên: Hoàng Hà, Võ Điền Gia Huy, Huỳnh Thanh Trực, NSƯT Chiều Xuân, Nghệ sĩ Viết Liên, NSND Ngọc Thư, Nguyễn Hữu...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s2.phim1280.tv/20240315/ixpvmeEt/index.m3u8"
          }
      ]
  },
  {
      "id": "gio-cao-diem",
      "slug": "gio-cao-diem",
      "crawlSlug": "gio-cao-diem",
      "title": "Giờ Cao Điểm",
      "originTitle": "Rush Hour",
      "poster": "https://phimimg.com/upload/vod/20231115-1/6bd1992872134d88b93b3f53fde32c24.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20231115-1/880ac8fa406774af3ff7f0e82232b3c8.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietsub",
          "au-my",
          "netflix"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "98 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 1998,
      "rating": 9.2,
      "matchScore": 98,
      "country": "Âu Mỹ",
      "countrySlug": "au-my",
      "genres": [
          "Hành Động",
          "Hài Hước",
          "Hình Sự"
      ],
      "director": "Brett Ratner",
      "cast": [
          "Jackie Chan",
          "Chris Tucker",
          "Tom Wilkinson",
          "Philip Baker Hall",
          "Elizabeth Peña",
          "Chris Penn"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "",
      "synopsis": "Giờ Cao Điểm là cuộc phiêu lưu của cặp bài trùng: Lee (Thành Long) và James Carter (Christ Turker) trong cuộc chiến chống lại thế lực hắc ám của hội Tam Hoàng. Những màn đấu võ hài hước, những pha mạo hiểm dựng tóc gáy là một phần không thể thiếu tạo nên thương hiệu Thành Long. Bạn sẽ thấy rất rõ điều này qua Giờ Cao Đ...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s1.phim1280.tv/20231125/OrLP2ljE/index.m3u8"
          }
      ]
  },
  {
      "id": "gio-cao-diem-2",
      "slug": "gio-cao-diem-2",
      "crawlSlug": "gio-cao-diem-2",
      "title": "Giờ Cao Điểm 2",
      "originTitle": "Rush Hour 2",
      "poster": "https://phimimg.com/upload/vod/20231211-1/1de096e929b0de310046f3b81964ec0d.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20231211-1/f2e44d8cf7f2d637599e1bbaa039e5a7.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietsub",
          "au-my",
          "netflix"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "90 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2001,
      "rating": 9.2,
      "matchScore": 98,
      "country": "Âu Mỹ",
      "countrySlug": "au-my",
      "genres": [
          "Hành Động",
          "Hài Hước",
          "Kinh Dị"
      ],
      "director": "Đang cập nhật",
      "cast": [
          "Dàn diễn viên"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "",
      "synopsis": "Đó là thời gian nghỉ để Det. James Carter và anh thấy mình cùng với Det. Lee ở Hồng Kông mong muốn phấn khích hơn. Trong khi Carter muốn tiệc tùng và gặp gỡ những người phụ nữ, Lee ra ngoài để theo dõi một Lord Gang Triad, người có thể chịu trách nhiệm giết hai người đàn ông tại Đại sứ quán Mỹ. Mọi thứ trở nên phức tạp...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s2.phim1280.tv/20240103/9Q9qg8H8/index.m3u8"
          }
      ]
  },
  {
      "id": "gio-cao-diem-3",
      "slug": "gio-cao-diem-3",
      "crawlSlug": "gio-cao-diem-3",
      "title": "Giờ Cao Điểm 3",
      "originTitle": "Rush Hour 3",
      "poster": "https://phimimg.com/upload/vod/20231210-1/ab5860df9137b0922a9a9ace30b6190b.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20231210-1/eeaa20506534d24246457c953c48019f.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietsub",
          "au-my",
          "netflix"
      ],
      "quality": "1080",
      "language": "Vietsub",
      "duration": "N/A",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2007,
      "rating": 9.2,
      "matchScore": 98,
      "country": "Âu Mỹ",
      "countrySlug": "au-my",
      "genres": [
          "Hành Động",
          "Hài Hước"
      ],
      "director": "Đang cập nhật",
      "cast": [
          "Dàn diễn viên"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "",
      "synopsis": "Gần ba năm sau cuộc phiêu lưu cuối cùng của họ trong Rush Hour 2 (2001), Carter hiện đang làm nhân viên giao thông Los Angeles, trong khi bạn của ông và Thanh tra cảnh sát Ace Hồng Kông, Lee, hộ tống Đại sứ Trung Quốc, Han, đến Tòa án Hình sự Thế giới , để tiết lộ thông tin quan trọng về các bộ ba. Tuy nhiên, sau một n...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s2.phim1280.tv/20231226/QJDWbgSU/index.m3u8"
          }
      ]
  },
  {
      "id": "harry-potter-va-hon-da-phu-thuy",
      "slug": "harry-potter-va-hon-da-phu-thuy",
      "crawlSlug": "harry-potter-va-hon-da-phu-thuy",
      "title": "Harry Potter và Hòn Đá Phù Thủy",
      "originTitle": "Harry Potter and the Philosopher's Stone",
      "poster": "https://phimimg.com/upload/vod/20250604-1/4f59b1adab4ec3e7354f1da1d4297d03.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20250602-1/0f3aebe145b25b985a1deece53635c99.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietsub",
          "au-my",
          "netflix"
      ],
      "quality": "1080",
      "language": "Vietsub + Lồng Tiếng + Thuyết Minh",
      "duration": "152 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2001,
      "rating": 9.2,
      "matchScore": 98,
      "country": "Anh",
      "countrySlug": "anh",
      "genres": [
          "Phiêu Lưu",
          "Viễn Tưởng"
      ],
      "director": "Chris Columbus",
      "cast": [
          "Daniel Radcliffe",
          "Rupert Grint",
          "Emma Watson",
          "Richard Harris",
          "Tom Felton",
          "Alan Rickman"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=l91Km49W9qI",
      "synopsis": "Harry Potter và Hòn Đá Phù Thủy là bộ phim đầu tiên trong series phim “Harry Potter” được xây dựng dựa trên tiểu thuyết của nhà văn J.K.Rowling. Nhân vật chính của phim, Harry Potter - một cậu bé 11 tuổi sau khi mồ côi cha mẹ đã bị gửi đến nhà dì dượng của mình, gia đình Dursley. Tuy nhiên, cậu bé bị ngược đãi và không...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s6.kkphimplayer6.com/20250603/8jLStzdU/index.m3u8"
          }
      ]
  },
  {
      "id": "harry-potter-va-can-phong-bi-mat",
      "slug": "harry-potter-va-can-phong-bi-mat",
      "crawlSlug": "harry-potter-va-can-phong-bi-mat",
      "title": "Harry Potter và Căn Phòng Bí Mật",
      "originTitle": "Harry Potter and the Chamber of Secrets",
      "poster": "https://phimimg.com/upload/vod/20250602-1/742fc1a9dd99323db33c3e2d90e9b094.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20250602-1/e9618bc36b27371bf5765869d9f23831.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietsub",
          "au-my",
          "netflix"
      ],
      "quality": "1080",
      "language": "Vietsub + Lồng Tiếng + Thuyết Minh",
      "duration": "161 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2002,
      "rating": 9.2,
      "matchScore": 98,
      "country": "Anh",
      "countrySlug": "anh",
      "genres": [
          "Phiêu Lưu",
          "Viễn Tưởng"
      ],
      "director": "Chris Columbus",
      "cast": [
          "Daniel Radcliffe",
          "Rupert Grint",
          "Emma Watson",
          "Kenneth Branagh",
          "Toby Jones",
          "Robbie Coltrane"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=Cy4fjVMOwsY",
      "synopsis": "Harry trở lại năm thứ hai tại Hogwarts, nhưng phát hiện ra rằng những điều tồi tệ đang xảy ra bởi vì một trang web có tên là Phòng chứa bí mật đã được người thừa kế của Slytherin mở ra và sẽ khiến những đứa trẻ của Muggles, những kẻ không trong sạch, xuất hiện một cách bí ẩn bởi một con vật quái dị....",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s6.kkphimplayer6.com/20250603/pI97byf8/index.m3u8"
          }
      ]
  },
  {
      "id": "harry-potter-va-tu-nhan-azkaban",
      "slug": "harry-potter-va-tu-nhan-azkaban",
      "crawlSlug": "harry-potter-va-tu-nhan-azkaban",
      "title": "Harry Potter và Tù Nhân Azkaban",
      "originTitle": "Harry Potter and the Prisoner of Azkaban",
      "poster": "https://phimimg.com/upload/vod/20250602-1/01a4ce613a13f86f386fc37b9d01044b.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20250602-1/56e3b9d83afe1bb47579e9b3488474f4.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietsub",
          "au-my",
          "netflix"
      ],
      "quality": "1080",
      "language": "Vietsub + Lồng Tiếng + Thuyết Minh",
      "duration": "141 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2004,
      "rating": 9.2,
      "matchScore": 98,
      "country": "Anh",
      "countrySlug": "anh",
      "genres": [
          "Phiêu Lưu",
          "Viễn Tưởng"
      ],
      "director": "Alfonso Cuarón",
      "cast": [
          "Daniel Radcliffe",
          "Rupert Grint",
          "Emma Watson",
          "Robbie Coltrane",
          "Michael Gambon",
          "Gary Oldman"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=q9-tAjeJ_nw",
      "synopsis": "Harry đang mong chờ đến cuối mùa hè để bắt đầu một khóa học mới tại Hogwarts, và rời khỏi ngôi nhà của người dì và người chú đáng khinh của mình, Dursley, càng sớm càng tốt. Điều Harry không biết là anh sẽ phải rời khỏi Privet Drive sớm và bất ngờ sau khi biến dì Marge của mình thành một quả bóng bay khổng lồ. Một chiế...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s6.kkphimplayer6.com/20250603/M3xcbcwe/index.m3u8"
          }
      ]
  },
  {
      "id": "harry-potter-va-chiec-coc-lua",
      "slug": "harry-potter-va-chiec-coc-lua",
      "crawlSlug": "harry-potter-va-chiec-coc-lua",
      "title": "Harry Potter và Chiếc Cốc Lửa",
      "originTitle": "Harry Potter and the Goblet of Fire",
      "poster": "https://phimimg.com/upload/vod/20250602-1/b7b55d9ad5585acd63a0d51717edbe7e.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20250602-1/a659814ab76a70bec26ee3b4bb35a645.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietsub",
          "au-my",
          "netflix"
      ],
      "quality": "1080",
      "language": "Vietsub + Lồng Tiếng + Thuyết Minh",
      "duration": "157 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2005,
      "rating": 9.2,
      "matchScore": 98,
      "country": "Anh",
      "countrySlug": "anh",
      "genres": [
          "Phiêu Lưu",
          "Viễn Tưởng"
      ],
      "director": "Mike Newell",
      "cast": [
          "Daniel Radcliffe",
          "Rupert Grint",
          "Emma Watson",
          "Brendan Gleeson",
          "Michael Gambon",
          "Robert Pattinson"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=Y3bLHHN129k",
      "synopsis": "Khi giải Quidditch Thế giới bị cắt ngang bởi những kẻ ủng hộ Chúa tể Voldemort và sự trở lại của Dấu hiệu hắc ám khủng khiếp, Harry ý thức được rõ ràng rằng, Chúa tể Voldemort đang ngày càng mạnh hơn. Và để trở lại thế giới phép thuật, Chúa tể hắc ám cần phải đánh bại kẻ duy nhất sống sót từ lời nguyền chết chóc của hắ...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s6.kkphimplayer6.com/20250603/ulu1ZgVA/index.m3u8"
          }
      ]
  },
  {
      "id": "harry-potter-va-menh-lenh-phuong-hoang",
      "slug": "harry-potter-va-menh-lenh-phuong-hoang",
      "crawlSlug": "harry-potter-va-menh-lenh-phuong-hoang",
      "title": "Harry Potter và Mệnh Lệnh Phượng Hoàng",
      "originTitle": "Harry Potter and the Order of the Phoenix",
      "poster": "https://phimimg.com/upload/vod/20250602-1/8d433ae93f9c5ba3086c1742b65f63b1.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20250602-1/48fa44ed4ca3fed2adf799240069b7ef.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietsub",
          "au-my",
          "netflix"
      ],
      "quality": "1080",
      "language": "Vietsub + Lồng Tiếng + Thuyết Minh",
      "duration": "138 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2007,
      "rating": 9.2,
      "matchScore": 98,
      "country": "Anh",
      "countrySlug": "anh",
      "genres": [
          "Phiêu Lưu",
          "Viễn Tưởng"
      ],
      "director": "David Yates",
      "cast": [
          "Daniel Radcliffe",
          "Rupert Grint",
          "Emma Watson",
          "Imelda Staunton",
          "Helena Bonham Carter",
          "Robbie Coltrane"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=oijDWW1CMt0",
      "synopsis": "Harry tức giận vì bị bỏ rơi ở nhà Dursley trong dịp hè, cậu ngờ rằng Chúa tể hắc ám Voldemort đang tập hợp lực lượng, và vì cậu có nguy cơ bị tấn công, những người Harry luôn coi là bạn đang cố che giấu tung tích cậu. Cuối cùng, sau khi được giải cứu, Harry khám phá ra rằng giáo sư Dumbledore đang tập hợp lại Hội Phượn...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s6.kkphimplayer6.com/20250603/IV0unvSk/index.m3u8"
          }
      ]
  },
  {
      "id": "harry-potter-va-hoang-tu-lai",
      "slug": "harry-potter-va-hoang-tu-lai",
      "crawlSlug": "harry-potter-va-hoang-tu-lai",
      "title": "Harry Potter và Hoàng Tử Lai",
      "originTitle": "Harry Potter and the Half-Blood Prince",
      "poster": "https://phimimg.com/upload/vod/20250602-1/6daf44b2ebbfdcd811af13d89589fada.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20250602-1/706ab376e08478b0956f619ffad48a76.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietsub",
          "au-my",
          "netflix"
      ],
      "quality": "1080",
      "language": "Vietsub + Lồng Tiếng + Thuyết Minh",
      "duration": "153 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2009,
      "rating": 9.2,
      "matchScore": 98,
      "country": "Anh",
      "countrySlug": "anh",
      "genres": [
          "Phiêu Lưu",
          "Viễn Tưởng"
      ],
      "director": "David Yates",
      "cast": [
          "Daniel Radcliffe",
          "Rupert Grint",
          "Emma Watson",
          "Jim Broadbent",
          "Michael Gambon",
          "Tom Felton"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=kLIoLXJTX_c",
      "synopsis": "Đây là năm thứ 6 của Harry Potter tại trường Hogwarts. Trong lúc những thế lực hắc ám của Voldemort gieo rắc nỗi kinh hoàng và sợ hãi ở khắp nơi, mọi chuyện càng lúc càng trở nên rõ ràng hơn đối với Harry, cậu sẽ sớm phải đối diện với định mệnh của mình. &nbsp;Draco Malfoy, kẻ thù không đội trời chung của Harry, có nhi...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s6.kkphimplayer6.com/20250603/LKNPHrC7/index.m3u8"
          }
      ]
  },
  {
      "id": "harry-potter-va-bao-boi-tu-than-phan-1",
      "slug": "harry-potter-va-bao-boi-tu-than-phan-1",
      "crawlSlug": "harry-potter-va-bao-boi-tu-than-phan-1",
      "title": "Harry Potter và Bảo Bối Tử Thần: Phần 1",
      "originTitle": "Harry Potter and the Deathly Hallows: Part 1",
      "poster": "https://phimimg.com/upload/vod/20250602-1/be0884caecf9eb4741932860ae5d5ae4.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20250602-1/c847d25d6018d0665aa03fb75c981c1a.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietsub",
          "au-my",
          "netflix"
      ],
      "quality": "1080",
      "language": "Vietsub + Lồng Tiếng + Thuyết Minh",
      "duration": "146 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2010,
      "rating": 9.2,
      "matchScore": 98,
      "country": "Anh",
      "countrySlug": "anh",
      "genres": [
          "Phiêu Lưu",
          "Viễn Tưởng"
      ],
      "director": "David Yates",
      "cast": [
          "Daniel Radcliffe",
          "Emma Watson",
          "Rupert Grint",
          "Toby Jones",
          "Helena Bonham Carter",
          "Alan Rickman"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=loDgd0irr3Y",
      "synopsis": "Chúa tể Voldemort cùng đám tay chân của hắn đang âm mưu tấn công Harry Potter khi cậu rời khỏi ngôi nhà của gia đình Dursley lần cuối cùng. Ngay trước khi phép bảo vệ cho Harry tại gia đình Dursley hết hiệu lực vào thời điểm Harry bước qua tuổi 17, người của Hội Phượng hoàng đến để hộ tống cậu tới một nơi ở mới an toàn...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s6.kkphimplayer6.com/20250603/gVVvqQnV/index.m3u8"
          }
      ]
  },
  {
      "id": "harry-potter-va-bao-boi-tu-than-phan-2",
      "slug": "harry-potter-va-bao-boi-tu-than-phan-2",
      "crawlSlug": "harry-potter-va-bao-boi-tu-than-phan-2",
      "title": "Harry Potter và Bảo Bối Tử Thần: Phần 2",
      "originTitle": "Harry Potter and the Deathly Hallows: Part 2",
      "poster": "https://phimimg.com/upload/vod/20250602-1/5ce2cb828266d80e466f0fcfafd123c8.jpg",
      "backdrop": "https://phimimg.com/upload/vod/20250602-1/4d1f429b653c19ff8f8e4fb17babb7b5.jpg",
      "type": "single",
      "sectionTags": [
          "hot",
          "de-cu",
          "phim-le",
          "vietsub",
          "au-my",
          "netflix"
      ],
      "quality": "1080",
      "language": "Vietsub + Lồng Tiếng + Thuyết Minh",
      "duration": "130 phút",
      "episodeCurrent": "Full",
      "episodeTotal": "1",
      "year": 2011,
      "rating": 9.2,
      "matchScore": 98,
      "country": "Anh",
      "countrySlug": "anh",
      "genres": [
          "Viễn Tưởng",
          "Phiêu Lưu"
      ],
      "director": "David Yates",
      "cast": [
          "Daniel Radcliffe",
          "Emma Watson",
          "Rupert Grint",
          "Ralph Fiennes",
          "Alan Rickman",
          "Michael Gambon"
      ],
      "ambientColors": [
          "#ffffff",
          "#d4d4d4",
          "#a3a3a3"
      ],
      "trailerUrl": "https://www.youtube.com/watch?v=EJrI-WxhU3s",
      "synopsis": "Kết thúc phần 1 là khi nhóm bạn Harry Potter, Ron và Hermione quay trở lại trường Hogwarts để tìm và tiêu diệt Trường Sinh Linh Giá cuối cùng của Voldemort. Nhưng Voldemort đã phát hiện ra nhiệm vụ của họ, và trận chiến pháp thuật lớn nhất trong lịch sử đã diễn ra ở đây, nơi mà biết bao người ngã xuống, nơi mà tất cả c...",
      "episodes": [
          {
              "name": "Full",
              "slug": "full",
              "source": "https://s6.kkphimplayer6.com/20250603/MTS2609t/index.m3u8"
          }
      ]
  },
  {
    id: "pm-1",
    slug: "thanh-guom-diet-quy-vo-han-thanh-465645",
    crawlSlug: "thanh-guom-diet-quy-vo-han-thanh",
    title: "Thanh Gươm Diệt Quỷ: Vô Hạn Thành",
    originTitle: "Demon Slayer: Kimetsu no Yaiba Infinity Castle",
    poster: "https://phimimg.com/upload/vod/20250722-1/66ee196318069c6ede9450a5f76a4648.jpg",
    backdrop: "https://phimimg.com/upload/vod/20250722-1/16ea0557ca40cd54a3d25c6750a65c0b.jpg",
    type: "single",
    sectionTags: ["de-cu", "anime", "phim-le", "hot"],
    quality: "1080",
    language: "Vietsub + Lồng Tiếng",
    duration: "155 phút",
    episodeCurrent: "Full",
    episodeTotal: "1",
    year: 2025,
    rating: 9.7,
    matchScore: 99,
    country: "Nhật Bản",
    countrySlug: "nhat-ban",
    genres: ["Anime", "Hành Động", "Phiêu Lưu", "Kỳ Ảo"],
    director: "Haruo Sotozaki",
    cast: ["Natsuki Hanae", "Akari Kito", "Hiro Shimono", "Yoshitsugu Matsuoka", "Takahiro Sakurai"],
    ambientColors: ["#fa2d48", "#ff6b35", "#6b2cf5"],
    trailerUrl: "https://www.youtube.com/watch?v=rf0hW__Skow",
    link: "https://phimmoiz.one/thanh-guom-diet-quy-vo-han-thanh-465645/",
    synopsis: "Thanh Gươm Diệt Quỷ: Vô Hạn Thành đưa Kamado Tanjiro cùng các Trụ Cột của Sát Quỷ Đội rơi thẳng vào sào huyệt không gian biến ảo của Chúa quỷ Kibutsuji Muzan. Tại Vô Hạn Thành, những trận huyết chiến sinh tử khốc liệt nhất giữa Sát Quỷ Đoàn và Thượng Huyền Quỷ chính thức bùng nổ với kỹ xảo đỉnh cao từ Ufotable.",
    episodes: [
      {
        name: "Bản Điện Ảnh Full",
        slug: "tap-01",
        source: "https://v7.kkphimplayer7.com/20260729/a8XUKTef/index.m3u8"
      }
    ]
  },
  {
    id: "pm-2",
    slug: "matchbox-phim-dien-anh",
    crawlSlug: "matchbox-phim-dien-anh",
    title: "Matchbox: Phim Điện Ảnh",
    originTitle: "Matchbox The Movie",
    poster: "https://phimimg.com/uploads/movies/20261011/matchbox-phim-dien-anh-poster.webp",
    backdrop: "https://phimimg.com/uploads/movies/20261011/matchbox-phim-dien-anh-thumb.webp",
    type: "single",
    sectionTags: ["de-cu", "hot", "phim-le", "au-my"],
    quality: "1080",
    language: "Vietsub",
    duration: "127 phút",
    episodeCurrent: "Full",
    episodeTotal: "1",
    year: 2026,
    rating: 8.9,
    matchScore: 97,
    country: "Âu Mỹ",
    countrySlug: "au-my",
    genres: ["Hành Động", "Phiêu Lưu", "Hài Hước"],
    director: "Sam Hargrave",
    cast: ["John Cena", "Jessica Biel", "Sam Richardson", "Danai Gurira", "Corey Stoll", "Teyonah Parris"],
    ambientColors: ["#ff453a", "#ff9f0a", "#0a84ff"],
    trailerUrl: "https://www.youtube.com/watch?v=7xfqITrMDcI",
    link: "https://phimmoiz.one/matchbox-phim-dien-anh/",
    synopsis: "Matchbox: Phim Điện Ảnh (Matchbox The Movie) là bộ phim hành động phiêu lưu Mỹ năm 2026, đưa khán giả vào cuộc truy đuổi quốc tế đầy kịch tính với những chiếc xe tốc độ cao. Câu chuyện bắt đầu khi Sean (John Cena), một đặc vụ CIA hoạt động bí mật, trở về quê nhà và vô tình kéo nhóm bạn thân thời thơ ấu vào âm mưu có thể đe dọa an ninh toàn cầu.",
    episodes: [
      {
        name: "Full FHD",
        slug: "full",
        source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8"
      }
    ]
  },
  {
    id: "pm-3",
    slug: "dich-nhan-kiet-lang-nhan-kiep",
    crawlSlug: "dich-nhan-kiet-lang-nhan-kiep",
    title: "Địch Nhân Kiệt: Lang Nhân Kiếp",
    originTitle: "The Frontier Under The Blood Moon",
    poster: "https://phimimg.com/uploads/movies/20261011/dich-nhan-kiet-lang-nhan-kiep-poster.webp",
    backdrop: "https://phimimg.com/uploads/movies/20261011/dich-nhan-kiet-lang-nhan-kiep-thumb.webp",
    type: "single",
    sectionTags: ["hot", "phim-le", "trung-quoc"],
    quality: "1080",
    language: "Vietsub",
    duration: "108 phút",
    episodeCurrent: "Full",
    episodeTotal: "1",
    year: 2026,
    rating: 8.6,
    matchScore: 95,
    country: "Trung Quốc",
    countrySlug: "trung-quoc",
    genres: ["Cổ Trang", "Bí Ẩn", "Hành Động", "Tâm Lý"],
    director: "Francis Nam",
    cast: ["Đỗ Dịch Hành", "Trương Tuyết Hàm", "Trương Thành Lãng", "John Do"],
    ambientColors: ["#c9184a", "#5a189a", "#ffb703"],
    trailerUrl: "",
    link: "https://phimmoiz.one/dich-nhan-kiet-lang-nhan-kiep/",
    synopsis: "Địch Nhân Kiệt: Lang Nhân Kiếp đưa khán giả đến vùng biên giới Đại Đường dưới ánh trăng máu, nơi Phật nữ được Tân La cử sang Đại Đường bất ngờ bị sát hại. Những dấu vết kỳ dị liên quan đến thầy phù thủy người sói của bộ lạc Túc Mạt khiến Địch Nhân Kiệt phải đấu trí phá giải kỳ án nhằm ngăn chặn chiến tranh.",
    episodes: [
      {
        name: "Full FHD",
        slug: "full",
        source: "https://a.kvp726.com/20261011/cSOFRRA3/index.m3u8"
      }
    ]
  },
  {
    id: "pm-4",
    slug: "squid-game-3-765752",
    crawlSlug: "tro-choi-con-muc-phan-3",
    title: "Trò Chơi Con Mực (Phần 3)",
    originTitle: "Squid Game (Season 3)",
    poster: "https://phimimg.com/upload/vod/20250627-1/95df698d6732124181f47c85b5f1a475.jpg",
    backdrop: "https://phimimg.com/upload/vod/20250627-1/d5d6027b96a3145442ae28753db855d5.jpg",
    type: "series",
    sectionTags: ["de-cu", "phim-bo", "han-quoc", "hot"],
    quality: "1080",
    language: "Vietsub + Lồng Tiếng",
    duration: "60 phút/tập",
    episodeCurrent: "Trọn Bộ 6 Tập",
    episodeTotal: "6",
    year: 2025,
    rating: 9.4,
    matchScore: 98,
    country: "Hàn Quốc",
    countrySlug: "han-quoc",
    genres: ["Hành Động", "Bí Ẩn", "Chính Kịch", "Giật Gân"],
    director: "Hwang Dong-hyuk",
    cast: ["Lee Jung-jae", "Lee Byung-hun", "Wi Ha-joon", "Im Si-wan", "Kang Ha-neul"],
    ambientColors: ["#ff0055", "#00b4d8", "#7209b7"],
    trailerUrl: "https://www.youtube.com/watch?v=oqxAJKy0ii4",
    link: "https://phimmoiz.one/squid-game-3-765752/",
    synopsis: "Hồi kết sinh tử của Seong Gi-hun (Người chơi 456) khi anh đối mặt trực diện với Front Man và những kẻ quyền lực đứng sau trò chơi tàn khốc. Những vòng chơi mới tàn nhẫn hơn buộc từng người chơi phải đưa ra lựa chọn giữa nhân tính và mạng sống.",
    episodes: [
      { name: "Tập 01", slug: "tap-01", source: "https://s6.kkphimplayer6.com/20250627/hMizT5jx/index.m3u8" },
      { name: "Tập 02", slug: "tap-02", source: "https://s6.kkphimplayer6.com/20250627/TO2A0YDD/index.m3u8" },
      { name: "Tập 03", slug: "tap-03", source: "https://s6.kkphimplayer6.com/20250627/iOxGrkAx/index.m3u8" },
      { name: "Tập 04", slug: "tap-04", source: "https://s6.kkphimplayer6.com/20250627/68hN3Ezw/index.m3u8" },
      { name: "Tập 05", slug: "tap-05", source: "https://s6.kkphimplayer6.com/20250627/MAHw1l33/index.m3u8" },
      { name: "Tập 06", slug: "tap-06", source: "https://s6.kkphimplayer6.com/20250627/LcmEDqk9/index.m3u8" }
    ]
  },
  {
    id: "pm-5",
    slug: "tai-xe-an-danh-phan-3",
    crawlSlug: "tai-xe-an-danh-phan-3",
    title: "Tài Xế Ẩn Danh (Phần 3)",
    originTitle: "Taxi Driver (Season 3)",
    poster: "https://phimimg.com/upload/vod/20251122-1/98a195e46ee8549833c3d8d15008c430.jpg",
    backdrop: "https://phimimg.com/upload/vod/20251122-1/dfe9d4568bdeee90b8889d716e359af8.jpg",
    type: "series",
    sectionTags: ["de-cu", "phim-bo", "han-quoc", "hot"],
    quality: "1080",
    language: "Vietsub + Thuyết Minh",
    duration: "64 phút/tập",
    episodeCurrent: "Tập 12 / 16",
    episodeTotal: "16",
    year: 2026,
    rating: 9.3,
    matchScore: 96,
    country: "Hàn Quốc",
    countrySlug: "han-quoc",
    genres: ["Hành Động", "Hình Sự", "Chính Kịch"],
    director: "Kang Bo-seung",
    cast: ["Lee Je-hoon", "Kim Eui-sung", "Pyo Ye-jin", "Jang Hyuk-jin", "Bae Yoo-ram"],
    ambientColors: ["#f77f00", "#d62828", "#003049"],
    trailerUrl: "",
    link: "https://phimmoiz.one/tai-xe-an-danh-phan-3/",
    synopsis: "Kim Do-gi và đội ngũ Hãng Taxi Cầu Vồng chính thức tái xuất trong Phần 3, thực thi công lý ngầm cho những nạn nhân tuyệt vọng mà pháp luật không thể bảo vệ trước các tập đoàn tội phạm xuyên quốc gia.",
    episodes: [
      { name: "Tập 01", slug: "tap-01", source: "https://s6.kkphimplayer6.com/20251121/N716QPFM/index.m3u8" },
      { name: "Tập 02", slug: "tap-02", source: "https://s6.kkphimplayer6.com/20251122/yavkt77F/index.m3u8" },
      { name: "Tập 03", slug: "tap-03", source: "https://s6.kkphimplayer6.com/20251129/C0Gd9aIW/index.m3u8" },
      { name: "Tập 04", slug: "tap-04", source: "https://s6.kkphimplayer6.com/20251201/47ufXutA/index.m3u8" },
      { name: "Tập 05", slug: "tap-05", source: "https://s6.kkphimplayer6.com/20251206/Bc6CMjNL/index.m3u8" },
      { name: "Tập 06", slug: "tap-06", source: "https://s6.kkphimplayer6.com/20251207/YzARaBer/index.m3u8" },
      { name: "Tập 07", slug: "tap-07", source: "https://s6.kkphimplayer6.com/20251213/NfXpZF0e/index.m3u8" },
      { name: "Tập 08", slug: "tap-08", source: "https://s6.kkphimplayer6.com/20251215/krN8HMNG/index.m3u8" },
      { name: "Tập 09", slug: "tap-09", source: "https://s6.kkphimplayer6.com/20251220/nz68y4X5/index.m3u8" },
      { name: "Tập 10", slug: "tap-10", source: "https://s6.kkphimplayer6.com/20251221/WmZfnI0e/index.m3u8" },
      { name: "Tập 11", slug: "tap-11", source: "https://s6.kkphimplayer6.com/20251227/bfnQAlHC/index.m3u8" },
      { name: "Tập 12", slug: "tap-12", source: "https://s6.kkphimplayer6.com/20251228/vionpD96/index.m3u8" },
      { name: "Tập 13", slug: "tap-13", source: "https://s6.kkphimplayer6.com/20260103/2eSy2nLP/index.m3u8" },
      { name: "Tập 14", slug: "tap-14", source: "https://s6.kkphimplayer6.com/20260104/DbvjnEOx/index.m3u8" },
      { name: "Tập 15", slug: "tap-15", source: "https://s6.kkphimplayer6.com/20260110/Nk2ryoYX/index.m3u8" },
      { name: "Tập 16", slug: "tap-16", source: "https://s6.kkphimplayer6.com/20260111/GZyb9Tjr/index.m3u8" }
    ]
  },
  {
    id: "pm-6",
    slug: "pham-nhan-tu-tien-truyen",
    crawlSlug: "pham-nhan-tu-tien-truyen",
    title: "Phàm Nhân Tu Tiên Truyện",
    originTitle: "The Immortal Ascension",
    poster: "https://phimimg.com/upload/vod/20250724-1/3acd42b880b9afc0e80ce1b3b66f4825.jpg",
    backdrop: "https://phimimg.com/upload/vod/20250724-1/8ac37168234fcdee704b2e60e3f8a2a2.jpg",
    type: "series",
    sectionTags: ["de-cu", "phim-bo", "trung-quoc"],
    quality: "1080",
    language: "Vietsub + Thuyết Minh",
    duration: "45 phút/tập",
    episodeCurrent: "Tập 30 / 30",
    episodeTotal: "30",
    year: 2025,
    rating: 9.2,
    matchScore: 95,
    country: "Trung Quốc",
    countrySlug: "trung-quoc",
    genres: ["Cổ Trang", "Kỳ Ảo", "Hành Động", "Phiêu Lưu"],
    director: "Dương Dương (Đạo diễn)",
    cast: ["Dương Dương", "Kim Thần", "Uông Đạc", "Triệu Tiểu Đường"],
    ambientColors: ["#2ec4b6", "#3a86ff", "#8338ec"],
    trailerUrl: "",
    link: "https://phimmoiz.one/pham-nhan-tu-tien-truyen/",
    synopsis: "Hàn Lập – một thiếu niên nghèo xuất thân phàm trần tình cờ bước chân vào con đường tu tiên đầy hiểm ác. Không có tư chất trác tuyệt, Hàn Lập dựa vào sự cẩn trọng, trí mưu và chiếc bình nhỏ bí ẩn để từng bước nghịch thiên tu hành.",
    episodes: [
      { name: "Tập 01", slug: "tap-01", source: "https://s6.kkphimplayer6.com/20250728/ze3orC91/index.m3u8" },
      { name: "Tập 02", slug: "tap-02", source: "https://s6.kkphimplayer6.com/20250728/UPNOtqUJ/index.m3u8" },
      { name: "Tập 03", slug: "tap-03", source: "https://s6.kkphimplayer6.com/20250728/1RHpdavK/index.m3u8" },
      { name: "Tập 04", slug: "tap-04", source: "https://s6.kkphimplayer6.com/20250728/1g10PeJ4/index.m3u8" },
      { name: "Tập 05", slug: "tap-05", source: "https://s6.kkphimplayer6.com/20250729/a90QdLjo/index.m3u8" },
      { name: "Tập 06", slug: "tap-06", source: "https://s6.kkphimplayer6.com/20250729/P2d2u9dR/index.m3u8" },
      { name: "Tập 07", slug: "tap-07", source: "https://s6.kkphimplayer6.com/20250729/e9le4eKM/index.m3u8" },
      { name: "Tập 08", slug: "tap-08", source: "https://s6.kkphimplayer6.com/20250729/DND7Ovej/index.m3u8" },
      { name: "Tập 09", slug: "tap-09", source: "https://s6.kkphimplayer6.com/20250730/UXz8XZ7z/index.m3u8" },
      { name: "Tập 10", slug: "tap-10", source: "https://s6.kkphimplayer6.com/20250730/pNPY1BzG/index.m3u8" },
      { name: "Tập 11", slug: "tap-11", source: "https://s6.kkphimplayer6.com/20250731/GdxHD1MM/index.m3u8" },
      { name: "Tập 12", slug: "tap-12", source: "https://s6.kkphimplayer6.com/20250801/G80ADFAr/index.m3u8" },
      { name: "Tập 13", slug: "tap-13", source: "https://s6.kkphimplayer6.com/20250801/awOuXwhE/index.m3u8" },
      { name: "Tập 14", slug: "tap-14", source: "https://s6.kkphimplayer6.com/20250802/gNLL3tB0/index.m3u8" },
      { name: "Tập 15", slug: "tap-15", source: "https://s6.kkphimplayer6.com/20250802/Xat88LtA/index.m3u8" },
      { name: "Tập 16", slug: "tap-16", source: "https://s6.kkphimplayer6.com/20250803/t2ELy1MH/index.m3u8" },
      { name: "Tập 17", slug: "tap-17", source: "https://s6.kkphimplayer6.com/20250804/J9zvk6fJ/index.m3u8" },
      { name: "Tập 18", slug: "tap-18", source: "https://s6.kkphimplayer6.com/20250805/yHgz6IoD/index.m3u8" },
      { name: "Tập 19", slug: "tap-19", source: "https://s6.kkphimplayer6.com/20250805/6OtPPAtV/index.m3u8" },
      { name: "Tập 20", slug: "tap-20", source: "https://s6.kkphimplayer6.com/20250807/M1disZmN/index.m3u8" },
      { name: "Tập 21", slug: "tap-21", source: "https://s6.kkphimplayer6.com/20250807/3vliYVbi/index.m3u8" },
      { name: "Tập 22", slug: "tap-22", source: "https://s6.kkphimplayer6.com/20250807/xjS85WCZ/index.m3u8" },
      { name: "Tập 23", slug: "tap-23", source: "https://s6.kkphimplayer6.com/20250809/XfiLrMFC/index.m3u8" },
      { name: "Tập 24", slug: "tap-24", source: "https://s6.kkphimplayer6.com/20250809/sFoJj4oz/index.m3u8" },
      { name: "Tập 25", slug: "tap-25", source: "https://s6.kkphimplayer6.com/20250811/zoAqc1YM/index.m3u8" },
      { name: "Tập 26", slug: "tap-26", source: "https://s6.kkphimplayer6.com/20250811/aHbjyGH9/index.m3u8" },
      { name: "Tập 27", slug: "tap-27", source: "https://s6.kkphimplayer6.com/20250813/kXoUnTmg/index.m3u8" },
      { name: "Tập 28", slug: "tap-28", source: "https://s6.kkphimplayer6.com/20250813/B8H4JSRr/index.m3u8" },
      { name: "Tập 29", slug: "tap-29", source: "https://s6.kkphimplayer6.com/20250813/jLqVHzXr/index.m3u8" },
      { name: "Tập 30", slug: "tap-30", source: "https://s6.kkphimplayer6.com/20250813/Lz2IVpgr/index.m3u8" }
    ]
  },
  {
    id: "pm-7",
    slug: "luat-su-cong-ich",
    crawlSlug: "luat-su-cong-ich",
    title: "Luật Sư Công Ích",
    originTitle: "Pro Bono",
    poster: "https://phimimg.com/upload/vod/20251207-1/f5049d137ddf6436f15279fada08d881.jpg",
    backdrop: "https://phimimg.com/upload/vod/20251207-1/e8c8db0b9567aded09109f7b9deda047.jpg",
    type: "series",
    sectionTags: ["de-cu", "phim-bo", "han-quoc"],
    quality: "1080",
    language: "Vietsub",
    duration: "70 phút/tập",
    episodeCurrent: "Tập 10 / 12",
    episodeTotal: "12",
    year: 2026,
    rating: 8.8,
    matchScore: 93,
    country: "Hàn Quốc",
    countrySlug: "han-quoc",
    genres: ["Chính Kịch", "Tâm Lý", "Hình Sự"],
    director: "Kim Sung-yoon",
    cast: ["Jung Kyung-ho", "So Ju-yeon", "Yoon Na-moo"],
    ambientColors: ["#0a84ff", "#5e5ce6", "#fa2d48"],
    trailerUrl: "",
    link: "https://phimmoiz.one/luat-su-cong-ich/",
    synopsis: "Một thẩm phán tài danh bất ngờ mất tất cả sau một biến cố chấn động và buộc phải gia nhập đội ngũ luật sư công ích với mức phí 0 đồng, nơi anh khám phá ra những góc khuất nhức nhối của xã hội hiện đại.",
    episodes: [
      { name: "Tập 01", slug: "tap-01", source: "https://s6.kkphimplayer6.com/20251207/x8vOfUmK/index.m3u8" },
      { name: "Tập 02", slug: "tap-02", source: "https://s6.kkphimplayer6.com/20251208/U76MV85s/index.m3u8" },
      { name: "Tập 03", slug: "tap-03", source: "https://s6.kkphimplayer6.com/20251215/hiTqmwV3/index.m3u8" },
      { name: "Tập 04", slug: "tap-04", source: "https://s6.kkphimplayer6.com/20251215/TDn1RonL/index.m3u8" },
      { name: "Tập 05", slug: "tap-05", source: "https://s6.kkphimplayer6.com/20251221/rcEOhkTt/index.m3u8" },
      { name: "Tập 06", slug: "tap-06", source: "https://s6.kkphimplayer6.com/20251222/2F8zAUlV/index.m3u8" },
      { name: "Tập 07", slug: "tap-07", source: "https://s6.kkphimplayer6.com/20251228/Vd7GUBpO/index.m3u8" },
      { name: "Tập 08", slug: "tap-08", source: "https://s6.kkphimplayer6.com/20251229/CDk8xPB4/index.m3u8" },
      { name: "Tập 09", slug: "tap-09", source: "https://s6.kkphimplayer6.com/20260105/3Et3TvaK/index.m3u8" },
      { name: "Tập 10", slug: "tap-10", source: "https://s6.kkphimplayer6.com/20260105/o5j3eiie/index.m3u8" },
      { name: "Tập 11", slug: "tap-11", source: "https://s6.kkphimplayer6.com/20260111/MpUkeuUP/index.m3u8" },
      { name: "Tập 12", slug: "tap-12", source: "https://s6.kkphimplayer6.com/20260111/J3H3Epl8/index.m3u8" }
    ]
  },
  {
    id: "pm-8",
    slug: "yet-hi",
    crawlSlug: "yet-hi",
    title: "Yết Hí",
    originTitle: "Unveil The Mask",
    poster: "https://phimimg.com/upload/vod/20260109-1/d6d82c20c56d61f31894bd979c3eda4a.jpg",
    backdrop: "https://phimimg.com/upload/vod/20260109-1/cc0563a07da12a6896dffc6aa176c998.jpg",
    type: "series",
    sectionTags: ["de-cu", "phim-bo", "trung-quoc", "hot"],
    quality: "1080",
    language: "Vietsub + Thuyết Minh",
    duration: "45 phút/tập",
    episodeCurrent: "Tập 24 / 28",
    episodeTotal: "28",
    year: 2026,
    rating: 9.0,
    matchScore: 94,
    country: "Trung Quốc",
    countrySlug: "trung-quoc",
    genres: ["Tình Cảm", "Bí Ẩn", "Chính Kịch"],
    director: "Mèo Cây (Miêu Đích Thụ)",
    cast: ["Trần Tinh Húc", "Lư Dục Hiểu", "Đạt Đạt"],
    ambientColors: ["#e63946", "#9d4edd", "#f4a261"],
    trailerUrl: "",
    link: "https://phimmoiz.one/yet-hi/",
    synopsis: "Giữa một trò chơi nhập vai kịch bản sát nhân lấy bối cảnh Dân Quốc đầy mê hoặc và thế giới kiến trúc hiện đại, hai con người mang vết thương lòng vô tình tháo gỡ chiếc mặt nạ của đối phương.",
    episodes: [
      { name: "Tập 01", slug: "tap-01", source: "https://s6.kkphimplayer6.com/20260109/HLPH86VP/index.m3u8" },
      { name: "Tập 02", slug: "tap-02", source: "https://s6.kkphimplayer6.com/20260109/eBjTvuhY/index.m3u8" },
      { name: "Tập 03", slug: "tap-03", source: "https://s6.kkphimplayer6.com/20260109/igotompu/index.m3u8" },
      { name: "Tập 04", slug: "tap-04", source: "https://s6.kkphimplayer6.com/20260109/cRNHqqUK/index.m3u8" },
      { name: "Tập 05", slug: "tap-05", source: "https://s6.kkphimplayer6.com/20260110/G22AO1GS/index.m3u8" },
      { name: "Tập 06", slug: "tap-06", source: "https://s6.kkphimplayer6.com/20260110/RtZI9g9b/index.m3u8" },
      { name: "Tập 07", slug: "tap-07", source: "https://s6.kkphimplayer6.com/20260112/w71pKZ7e/index.m3u8" },
      { name: "Tập 08", slug: "tap-08", source: "https://s6.kkphimplayer6.com/20260112/KB54ST5j/index.m3u8" },
      { name: "Tập 09", slug: "tap-09", source: "https://s6.kkphimplayer6.com/20260112/WFUSupod/index.m3u8" },
      { name: "Tập 10", slug: "tap-10", source: "https://s6.kkphimplayer6.com/20260112/EQkqkYrq/index.m3u8" },
      { name: "Tập 11", slug: "tap-11", source: "https://s6.kkphimplayer6.com/20260113/fRKRU6yA/index.m3u8" },
      { name: "Tập 12", slug: "tap-12", source: "https://s6.kkphimplayer6.com/20260113/m8RO4vqV/index.m3u8" },
      { name: "Tập 13", slug: "tap-13", source: "https://s6.kkphimplayer6.com/20260114/PqjDKJdP/index.m3u8" },
      { name: "Tập 14", slug: "tap-14", source: "https://s6.kkphimplayer6.com/20260114/d4gkmEIz/index.m3u8" },
      { name: "Tập 15", slug: "tap-15", source: "https://s6.kkphimplayer6.com/20260115/l1hZT2YO/index.m3u8" },
      { name: "Tập 16", slug: "tap-16", source: "https://s6.kkphimplayer6.com/20260115/TShf8KRW/index.m3u8" },
      { name: "Tập 17", slug: "tap-17", source: "https://s6.kkphimplayer6.com/20260116/99vxV2SF/index.m3u8" },
      { name: "Tập 18", slug: "tap-18", source: "https://s6.kkphimplayer6.com/20260117/dYcF37K8/index.m3u8" },
      { name: "Tập 19", slug: "tap-19", source: "https://s6.kkphimplayer6.com/20260117/NQoai5TJ/index.m3u8" },
      { name: "Tập 20", slug: "tap-20", source: "https://s6.kkphimplayer6.com/20260118/qFEuISWG/index.m3u8" },
      { name: "Tập 21", slug: "tap-21", source: "https://s6.kkphimplayer6.com/20260120/KlfHdOnR/index.m3u8" },
      { name: "Tập 22", slug: "tap-22", source: "https://s6.kkphimplayer6.com/20260120/7rWzHo8P/index.m3u8" },
      { name: "Tập 23", slug: "tap-23", source: "https://s6.kkphimplayer6.com/20260120/5ZPdg0hP/index.m3u8" },
      { name: "Tập 24", slug: "tap-24", source: "https://s6.kkphimplayer6.com/20260120/bqJkMdOa/index.m3u8" },
      { name: "Tập 25", slug: "tap-25", source: "https://s6.kkphimplayer6.com/20260120/xKb2dpgl/index.m3u8" },
      { name: "Tập 26", slug: "tap-26", source: "https://s6.kkphimplayer6.com/20260120/eZq2Ip6p/index.m3u8" },
      { name: "Tập 27", slug: "tap-27", source: "https://s6.kkphimplayer6.com/20260120/0AYLxrAd/index.m3u8" },
      { name: "Tập 28", slug: "tap-28", source: "https://s6.kkphimplayer6.com/20260120/3tHnY39y/index.m3u8" }
    ]
  },
  {
    id: "pm-9",
    slug: "nhiem-vu-bat-kha-thi-nghiep-bao-phan-2-1",
    crawlSlug: "nhiem-vu-bat-kha-thi-nghiep-bao-phan-2",
    title: "Nhiệm Vụ: Bất Khả Thi - Nghiệp Báo (Phần 2)",
    originTitle: "Mission: Impossible - The Final Reckoning",
    poster: "https://phimimg.com/upload/vod/20250520-1/4897205e466f093e268e5e0336f667a6.jpg",
    backdrop: "https://phimimg.com/upload/vod/20250520-1/93b6f1f8e35b763a61a92a8c10558e96.jpg",
    type: "single",
    sectionTags: ["de-cu", "phim-le", "au-my", "hot"],
    quality: "1080",
    language: "Vietsub",
    duration: "169 phút",
    episodeCurrent: "Full",
    episodeTotal: "1",
    year: 2025,
    rating: 9.3,
    matchScore: 98,
    country: "Âu Mỹ",
    countrySlug: "au-my",
    genres: ["Hành Động", "Phiêu Lưu", "Giật Gân"],
    director: "Christopher McQuarrie",
    cast: ["Tom Cruise", "Hayley Atwell", "Ving Rhames", "Simon Pegg", "Vanessa Kirby"],
    ambientColors: ["#d90429", "#ff9f1c", "#2b2d42"],
    trailerUrl: "https://www.youtube.com/watch?v=NOhDyUmT9z0",
    link: "https://phimmoiz.one/nhiem-vu-bat-kha-thi-nghiep-bao-phan-2-1/",
    synopsis: "Đặc vụ Ethan Hunt và tổ chức IMF bước vào nhiệm vụ sinh tử cuối cùng nhằm truy tìm chiếc tàu ngầm Sevastopol và vô hiệu hóa siêu trí tuệ nhân tạo Thực Thể (The Entity) trước khi nó kiểm soát kho vũ khí hạt nhân toàn cầu.",
    episodes: [
      { name: "Full", slug: "full", source: "https://s6.kkphimplayer6.com/20250818/5dNgqyZD/index.m3u8" }
    ]
  },
  {
    id: "pm-10",
    slug: "mua-do",
    crawlSlug: "mua-do",
    title: "Mưa Đỏ",
    originTitle: "Red Rain",
    poster: "https://upload.wikimedia.org/wikipedia/vi/4/49/Mua_do_poster.jpg",
    backdrop: "https://upload.wikimedia.org/wikipedia/vi/b/b7/M%C6%B0a_%C4%91%E1%BB%8F_ti%E1%BB%83u_%C4%91%E1%BB%99i.png",
    type: "single",
    sectionTags: ["viet-nam", "phim-le", "de-cu"],
    quality: "1080",
    language: "Vietsub",
    duration: "124 phút",
    episodeCurrent: "Full",
    episodeTotal: "1",
    year: 2025,
    rating: 9.5,
    matchScore: 97,
    country: "Việt Nam",
    countrySlug: "viet-nam",
    genres: ["Chiến Tranh", "Lịch Sử", "Chính Kịch", "Hành Động"],
    director: "Đặng Thái Huyền",
    cast: ["Hứa Vĩ Văn", "Đỗ Nhật Hoàng", "Lê Hạ Anh"],
    ambientColors: ["#e63946", "#ffb703", "#6d597a"],
    trailerUrl: "",
    link: "https://phimmoiz.one/mua-do/",
    synopsis: "Bộ phim điện ảnh lịch sử hào hùng tái hiện 81 ngày đêm chiến đấu kiên cường bảo vệ Thành cổ Quảng Trị mùa hè đỏ lửa năm 1972 với những thước phim bi tráng, xúc động.",
    episodes: [
      { name: "Full", slug: "full", source: "https://s6.kkphimplayer6.com/20251118/obSmOjv7/index.m3u8" }
    ]
  },
  {
    id: "pm-11",
    slug: "dia-dao-mat-troi-trong-bong-toi",
    crawlSlug: "dia-dao-mat-troi-trong-bong-toi",
    title: "Địa Đạo: Mặt Trời Trong Bóng Tối",
    originTitle: "Tunnels: Sun In The Dark",
    poster: "https://phimimg.com/upload/vod/20250519-1/9877afe853d8484edcbe040cb3221ced.jpg",
    backdrop: "https://phimimg.com/upload/vod/20250519-1/d041b7d764329efdbb5222010f0f1796.jpg",
    type: "single",
    sectionTags: ["viet-nam", "phim-le", "de-cu"],
    quality: "1080",
    language: "Vietsub",
    duration: "120 phút",
    episodeCurrent: "Full",
    episodeTotal: "1",
    year: 2025,
    rating: 9.4,
    matchScore: 96,
    country: "Việt Nam",
    countrySlug: "viet-nam",
    genres: ["Chiến Tranh", "Lịch Sử", "Hành Động", "Chính Kịch"],
    director: "Bùi Thạc Chuyên",
    cast: ["Thái Hòa", "Quang Tuấn", "Hồ Thu Anh"],
    ambientColors: ["#d97706", "#dc2626", "#4b5563"],
    trailerUrl: "",
    link: "https://phimmoiz.one/dia-dao-mat-troi-trong-bong-toi/",
    synopsis: "Năm 1967, tại căn cứ địa đạo Củ Chi, đội du kích 21 người do Bảy Theo (Thái Hòa) chỉ huy phải bám trụ dưới lòng đất nghẹt thở để bảo vệ nhóm tình báo chiến lược trước cuộc càn quét khốc liệt.",
    episodes: [
      { name: "Full", slug: "full", source: "https://s4.phim1280.tv/20250519/1eZFjqYo/index.m3u8" }
    ]
  },
  {
    id: "pm-12",
    slug: "nha-gia-tien",
    crawlSlug: "nha-gia-tien",
    title: "Nhà Gia Tiên",
    originTitle: "The Ancestral Home",
    poster: "https://phimimg.com/upload/vod/20250710-1/5af1cd558e89eb88b67d72181906edac.jpg",
    backdrop: "https://phimimg.com/upload/vod/20250710-1/3024e503f4c8cecdb0578c20c77e4cdf.jpg",
    type: "single",
    sectionTags: ["de-cu", "viet-nam", "phim-le"],
    quality: "1080",
    language: "Vietsub",
    duration: "117 phút",
    episodeCurrent: "Full",
    episodeTotal: "1",
    year: 2025,
    rating: 8.7,
    matchScore: 94,
    country: "Việt Nam",
    countrySlug: "viet-nam",
    genres: ["Tâm Lý", "Gia Đình", "Bí Ẩn", "Hài Hước"],
    director: "Huỳnh Lập",
    cast: ["Huỳnh Lập", "Phương Mỹ Chi", "NSƯT Hạnh Thúy", "Puka"],
    ambientColors: ["#f59e0b", "#ef4444", "#7c3aed"],
    trailerUrl: "",
    link: "https://phimmoiz.one/nha-gia-tien/",
    synopsis: "Mỹ Tiên – một nhà sáng tạo nội dung Gen Z trở về căn nhà cổ của gia đình để quay video triệu view và bất ngờ nhìn thấy linh hồn người anh trai đã khuất Gia Minh, mở ra những bí mật truyền thống đầy cảm xúc.",
    episodes: [
      { name: "Full", slug: "full", source: "https://s6.kkphimplayer6.com/20250710/0Du10Bcc/index.m3u8" }
    ]
  },
  {
    id: "pm-13",
    slug: "tham-tu-kien-ky-an-khong-dau",
    crawlSlug: "tham-tu-kien-ky-an-khong-dau",
    title: "Thám Tử Kiên: Kỳ Án Không Đầu",
    originTitle: "Detective Kien: The Headless Horror",
    poster: "https://phimimg.com/upload/vod/20251010-1/d5236005ee6df744aa5417cf5231f167.jpg",
    backdrop: "https://phimimg.com/upload/vod/20251010-1/3c95bc59bc3c37fc3fb76e27b156d1bf.jpg",
    type: "single",
    sectionTags: ["viet-nam", "phim-le", "hot"],
    quality: "1080",
    language: "Vietsub",
    duration: "131 phút",
    episodeCurrent: "Full",
    episodeTotal: "1",
    year: 2025,
    rating: 8.9,
    matchScore: 95,
    country: "Việt Nam",
    countrySlug: "viet-nam",
    genres: ["Bí Ẩn", "Kinh Dị", "Cổ Trang", "Hình Sự"],
    director: "Victor Vũ",
    cast: ["Quốc Huy", "Đinh Ngọc Diệp", "Quốc Anh", "Minh Anh"],
    ambientColors: ["#991b1b", "#4c1d95", "#d97706"],
    trailerUrl: "",
    link: "https://phimmoiz.one/tham-tu-kien-ky-an-khong-dau/",
    synopsis: "Thám tử Kiên bước vào cuộc điều tra chuỗi án mạng kỳ bí nơi vùng sơn cước cổ xưa, nơi lời đồn về oán linh không đầu che đậy một âm mưu thâm độc.",
    episodes: [
      { name: "Full", slug: "full", source: "https://s6.kkphimplayer6.com/20251010/86AEDncn/index.m3u8" }
    ]
  },
  {
    id: "pm-14",
    slug: "good-boy-18",
    crawlSlug: "kien-tuong",
    title: "Good Boy: Kiện Tướng Nắm Đấm",
    originTitle: "Good Boy",
    poster: "https://phimimg.com/upload/vod/20250601-1/f3bbb466904489c0eb475f89bf6e3166.jpg",
    backdrop: "https://phimimg.com/upload/vod/20250601-1/89524a3a031fbfa2f29eb7b81cff489f.jpg",
    type: "series",
    sectionTags: ["de-cu", "han-quoc", "phim-bo"],
    quality: "1080",
    language: "Vietsub",
    duration: "65 phút/tập",
    episodeCurrent: "Tập 16 / 16",
    episodeTotal: "16",
    year: 2025,
    rating: 9.1,
    matchScore: 95,
    country: "Hàn Quốc",
    countrySlug: "han-quoc",
    genres: ["Hành Động", "Hài Hước", "Hình Sự"],
    director: "Shim Na-yeon",
    cast: ["Park Bo-gum", "Kim So-hyun", "Oh Jung-se", "Lee Sang-yi"],
    ambientColors: ["#3b82f6", "#ef4444", "#f59e0b"],
    trailerUrl: "",
    link: "https://phimmoiz.one/good-boy-18/",
    synopsis: "Nhóm cựu vận động viên từng giành huy chương vàng Olympic được tuyển dụng đặc biệt vào lực lượng cảnh sát, dùng kỹ năng thể thao thượng thừa để trấn áp tội phạm bạo lực.",
    episodes: [
      { name: "Tập 01", slug: "tap-01", source: "https://s6.kkphimplayer6.com/20250618/hRS5sPDj/index.m3u8" },
      { name: "Tập 02", slug: "tap-02", source: "https://s6.kkphimplayer6.com/20250618/xxvp7yZZ/index.m3u8" },
      { name: "Tập 03", slug: "tap-03", source: "https://s6.kkphimplayer6.com/20250618/MgHkQBwa/index.m3u8" },
      { name: "Tập 04", slug: "tap-04", source: "https://s6.kkphimplayer6.com/20250624/bdqIIkbQ/index.m3u8" },
      { name: "Tập 05", slug: "tap-05", source: "https://s6.kkphimplayer6.com/20250618/xkguwxLs/index.m3u8" },
      { name: "Tập 06", slug: "tap-06", source: "https://s6.kkphimplayer6.com/20250620/tdIYTddA/index.m3u8" },
      { name: "Tập 07", slug: "tap-07", source: "https://s6.kkphimplayer6.com/20250623/i3ZbWmh3/index.m3u8" },
      { name: "Tập 08", slug: "tap-08", source: "https://s6.kkphimplayer6.com/20250624/bk5Db22T/index.m3u8" },
      { name: "Tập 09", slug: "tap-09", source: "https://s6.kkphimplayer6.com/20250702/0PdbjscV/index.m3u8" },
      { name: "Tập 10", slug: "tap-10", source: "https://s6.kkphimplayer6.com/20250703/LA5EIR6w/index.m3u8" },
      { name: "Tập 11", slug: "tap-11", source: "https://s6.kkphimplayer6.com/20250708/o4tTqK9v/index.m3u8" },
      { name: "Tập 12", slug: "tap-12", source: "https://s6.kkphimplayer6.com/20250714/Om1NUuOK/index.m3u8" },
      { name: "Tập 13", slug: "tap-13", source: "https://s6.kkphimplayer6.com/20250721/LRGoa9X4/index.m3u8" },
      { name: "Tập 14", slug: "tap-14", source: "https://s6.kkphimplayer6.com/20250721/iEmYrk9a/index.m3u8" },
      { name: "Tập 15", slug: "tap-15", source: "https://s6.kkphimplayer6.com/20250722/wgdbt7ts/index.m3u8" },
      { name: "Tập 16", slug: "tap-16", source: "https://s6.kkphimplayer6.com/20250722/xVgLpnpi/index.m3u8" }
    ]
  },
  {
    id: "pm-15",
    slug: "head-over-heels-24",
    crawlSlug: "nguu-lang-chuc-nu",
    title: "Ngưu Lang Chức Nữ",
    originTitle: "Head Over Heels",
    poster: "https://phimimg.com/upload/vod/20250624-1/6295cf08845cf14b511410c7547d336a.jpg",
    backdrop: "https://phimimg.com/upload/vod/20250624-1/93e56e4419410c589a127345fb0c0379.jpg",
    type: "series",
    sectionTags: ["de-cu", "han-quoc", "phim-bo"],
    quality: "1080",
    language: "Vietsub",
    duration: "62 phút/tập",
    episodeCurrent: "Tập 12 / 12",
    episodeTotal: "12",
    year: 2025,
    rating: 8.8,
    matchScore: 92,
    country: "Hàn Quốc",
    countrySlug: "han-quoc",
    genres: ["Tình Cảm", "Kỳ Ảo", "Hài Hước"],
    director: "Kim Yong-wan",
    cast: ["Cho Yi-hyun", "Choo Young-woo"],
    ambientColors: ["#ec4899", "#8b5cf6", "#3b82f6"],
    trailerUrl: "",
    link: "https://phimmoiz.one/head-over-heels-24/",
    synopsis: "Nữ sinh trung học ban ngày đi học, ban đêm là pháp sư tài năng tìm mọi cách giải cứu mối tình đầu của mình khỏi vận mệnh tử thần đã được định đoạt.",
    episodes: [
      { name: "Tập 01", slug: "tap-01", source: "https://s6.kkphimplayer6.com/20250624/FxmAZH83/index.m3u8" },
      { name: "Tập 02", slug: "tap-02", source: "https://s6.kkphimplayer6.com/20250625/4rdDIfLu/index.m3u8" },
      { name: "Tập 03", slug: "tap-03", source: "https://s6.kkphimplayer6.com/20250706/gpg4uuj4/index.m3u8" },
      { name: "Tập 04", slug: "tap-04", source: "https://s6.kkphimplayer6.com/20250706/4O76kiqo/index.m3u8" },
      { name: "Tập 05", slug: "tap-05", source: "https://s6.kkphimplayer6.com/20250716/1rDRDTFu/index.m3u8" },
      { name: "Tập 06", slug: "tap-06", source: "https://s6.kkphimplayer6.com/20250716/M1ihu9Y4/index.m3u8" },
      { name: "Tập 07", slug: "tap-07", source: "https://s6.kkphimplayer6.com/20250716/bSvfUnJp/index.m3u8" },
      { name: "Tập 08", slug: "tap-08", source: "https://s6.kkphimplayer6.com/20250717/cstPe9nW/index.m3u8" },
      { name: "Tập 09", slug: "tap-09", source: "https://s6.kkphimplayer6.com/20250725/bFtLNpRh/index.m3u8" },
      { name: "Tập 10", slug: "tap-10", source: "https://s6.kkphimplayer6.com/20250725/fLUZtn24/index.m3u8" },
      { name: "Tập 11", slug: "tap-11", source: "https://s6.kkphimplayer6.com/20250731/b2na1ZrP/index.m3u8" },
      { name: "Tập 12", slug: "tap-12", source: "https://s6.kkphimplayer6.com/20250808/Pyk1UCUW/index.m3u8" }
    ]
  },
  {
    id: "pm-16",
    slug: "cau-be-mat-tich-phan-5",
    crawlSlug: "cau-be-mat-tich-phan-5",
    title: "Cậu Bé Mất Tích (Phần 5)",
    originTitle: "Stranger Things (Season 5)",
    poster: "https://phimimg.com/upload/vod/20251127-1/88dfce03b997600f0a898945fe8facb2.jpg",
    backdrop: "https://phimimg.com/upload/vod/20251127-1/04a8a61670f1faf048ebc3450d6ccdb5.jpg",
    type: "series",
    sectionTags: ["au-my", "phim-bo", "hot", "de-cu"],
    quality: "1080",
    language: "Vietsub",
    duration: "143 phút/tập",
    episodeCurrent: "Tập 8 / 8",
    episodeTotal: "8",
    year: 2025,
    rating: 9.6,
    matchScore: 99,
    country: "Âu Mỹ",
    countrySlug: "au-my",
    genres: ["Viễn Tưởng", "Bí Ẩn", "Phiêu Lưu", "Kinh Dị"],
    director: "The Duffer Brothers",
    cast: ["Millie Bobby Brown", "Finn Wolfhard", "Winona Ryder", "David Harbour", "Sadie Sink"],
    ambientColors: ["#e11d48", "#311042", "#dc2626"],
    trailerUrl: "",
    link: "https://phimmoiz.one/cau-be-mat-tich-phan-5/",
    synopsis: "Trận chiến cuối cùng bảo vệ thị trấn Hawkins trước sự xâm lăng toàn diện của Thế Giới Ngược (Upside Down) và Vecna. Eleven cùng những người bạn phải hợp sức cho trận quyết chiến vĩ đại nhất.",
    episodes: [
      { name: "Tập 01", slug: "tap-01", source: "https://s6.kkphimplayer6.com/20251127/NoUDNYzy/index.m3u8" },
      { name: "Tập 02", slug: "tap-02", source: "https://s6.kkphimplayer6.com/20251127/8am8mw20/index.m3u8" },
      { name: "Tập 03", slug: "tap-03", source: "https://s6.kkphimplayer6.com/20251127/4rtaCnZ2/index.m3u8" },
      { name: "Tập 04", slug: "tap-04", source: "https://s6.kkphimplayer6.com/20251127/ffY9H7GS/index.m3u8" },
      { name: "Tập 05", slug: "tap-05", source: "https://s6.kkphimplayer6.com/20251226/J2r4ZGpL/index.m3u8" },
      { name: "Tập 06", slug: "tap-06", source: "https://s6.kkphimplayer6.com/20251226/3d08cFWL/index.m3u8" },
      { name: "Tập 07", slug: "tap-07", source: "https://s6.kkphimplayer6.com/20251226/Rx89muZ4/index.m3u8" },
      { name: "Tập 08", slug: "tap-08", source: "https://s6.kkphimplayer6.com/20260101/rLJU40AB/index.m3u8" }
    ]
  },
  {
    id: "pm-17",
    slug: "sup-do-phan-2",
    crawlSlug: "sup-do-phan-2",
    title: "Sụp Đổ (Phần 2)",
    originTitle: "Fallout (Season 2)",
    poster: "https://phimimg.com/upload/vod/20251218-1/97fcfb8cfdae35b08e3b22a7e3fd3b5a.jpg",
    backdrop: "https://phimimg.com/upload/vod/20251218-1/edf322e64d437755bd03623d7c8298a5.jpg",
    type: "series",
    sectionTags: ["au-my", "phim-bo"],
    quality: "1080",
    language: "Vietsub",
    duration: "62 phút/tập",
    episodeCurrent: "Tập 8 / 8",
    episodeTotal: "8",
    year: 2026,
    rating: 9.1,
    matchScore: 94,
    country: "Âu Mỹ",
    countrySlug: "au-my",
    genres: ["Viễn Tưởng", "Hành Động", "Phiêu Lưu"],
    director: "Jonathan Nolan",
    cast: ["Ella Purnell", "Walton Goggins", "Aaron Moten"],
    ambientColors: ["#eab308", "#2563eb", "#dc2626"],
    trailerUrl: "",
    link: "https://phimmoiz.one/sup-do-phan-2/",
    synopsis: "Lucy và The Ghoul tiếp tục hành trình băng qua vùng đất hoang tàn hậu tận thế tiến về New Vegas để truy tìm sự thật đằng sau tập đoàn Vault-Tec.",
    episodes: [
      { name: "Tập 01", slug: "tap-01", source: "https://s6.kkphimplayer6.com/20251218/cYE0ahfU/index.m3u8" },
      { name: "Tập 02", slug: "tap-02", source: "https://s6.kkphimplayer6.com/20251226/Yx8SyXG1/index.m3u8" },
      { name: "Tập 03", slug: "tap-03", source: "https://s6.kkphimplayer6.com/20260101/fzfqPmF8/index.m3u8" },
      { name: "Tập 04", slug: "tap-04", source: "https://s6.kkphimplayer6.com/20260108/mjOmC1Hs/index.m3u8" },
      { name: "Tập 05", slug: "tap-05", source: "https://s6.kkphimplayer6.com/20260116/HNQf8gZh/index.m3u8" },
      { name: "Tập 06", slug: "tap-06", source: "https://s6.kkphimplayer6.com/20260122/CRxBNuRT/index.m3u8" },
      { name: "Tập 07", slug: "tap-07", source: "https://s6.kkphimplayer6.com/20260129/ipRVMzGp/index.m3u8" },
      { name: "Tập 08", slug: "tap-08", source: "https://s6.kkphimplayer6.com/20260205/G7cntTgh/index.m3u8" }
    ]
  },
  {
    id: "pm-18",
    slug: "thanh-guom-diet-quy-lang-tho-ren",
    crawlSlug: "thanh-guom-diet-quy-phan-4-lang-tho-ren",
    title: "Thanh Gươm Diệt Quỷ: Làng Thợ Rèn",
    originTitle: "Demon Slayer (Season 4) (Swordsmith Village Arc)",
    poster: "https://phimimg.com/upload/vod/20250427-1/c1ed81199e77a349d236c842953c9c6a.jpg",
    backdrop: "https://phimimg.com/upload/vod/20240308-1/a0f9644299d8322f495e5fda38098f39.jpg",
    type: "series",
    sectionTags: ["de-cu", "anime", "phim-bo"],
    quality: "1080",
    language: "Vietsub + Lồng Tiếng",
    duration: "24 phút/tập",
    episodeCurrent: "Trọn Bộ 11 Tập",
    episodeTotal: "11",
    year: 2024,
    rating: 9.3,
    matchScore: 98,
    country: "Nhật Bản",
    countrySlug: "nhat-ban",
    genres: ["Anime", "Hành Động", "Phiêu Lưu", "Kỳ Ảo"],
    director: "Haruo Sotozaki",
    cast: ["Natsuki Hanae", "Akari Kito", "Kana Hanazawa", "Kengo Kawanishi"],
    ambientColors: ["#10b981", "#ec4899", "#f43f5e"],
    trailerUrl: "",
    link: "https://phimmoiz.one/thanh-guom-diet-quy-lang-tho-ren/",
    synopsis: "Tanjiro tìm đến Làng Thợ Rèn bí mật để rèn lại thanh Nhật Luân Kiếm và sát cánh cùng Luyến Trụ Mitsuri, Hà Trụ Muichiro chống lại sự tấn công bất ngờ của hai Thượng Huyền Quỷ.",
    episodes: [
      { name: "Tập 01", slug: "tap-01", source: "https://s5.phim1280.tv/20250427/7aK7vnZo/index.m3u8" },
      { name: "Tập 02", slug: "tap-02", source: "https://s5.phim1280.tv/20250427/USgu7fBQ/index.m3u8" },
      { name: "Tập 03", slug: "tap-03", source: "https://s5.phim1280.tv/20250427/1xT6IrMZ/index.m3u8" },
      { name: "Tập 04", slug: "tap-04", source: "https://s5.phim1280.tv/20250427/JpaofnA3/index.m3u8" },
      { name: "Tập 05", slug: "tap-05", source: "https://s5.phim1280.tv/20250427/8FuhnuMe/index.m3u8" },
      { name: "Tập 06", slug: "tap-06", source: "https://s5.phim1280.tv/20250427/RxHqbtcG/index.m3u8" },
      { name: "Tập 07", slug: "tap-07", source: "https://s5.phim1280.tv/20250427/KUWxJJAg/index.m3u8" },
      { name: "Tập 08", slug: "tap-08", source: "https://s5.phim1280.tv/20250427/HlsAwFBi/index.m3u8" },
      { name: "Tập 09", slug: "tap-09", source: "https://s5.phim1280.tv/20250427/EoHJaO7Y/index.m3u8" },
      { name: "Tập 10", slug: "tap-10", source: "https://s5.phim1280.tv/20250427/1QizZ6Q3/index.m3u8" },
      { name: "Tập 11", slug: "tap-11", source: "https://s5.phim1280.tv/20250427/y2lsICh1/index.m3u8" }
    ]
  },
  {
    id: "pm-19",
    slug: "thanh-guom-diet-quy-ky-vien-tran",
    crawlSlug: "thanh-guom-diet-quy-phan-3-ky-vien-tran",
    title: "Thanh Gươm Diệt Quỷ: Kỹ Viện Trấn",
    originTitle: "Demon Slayer (Season 3) (Entertainment District Arc)",
    poster: "https://phimimg.com/upload/vod/20250427-1/ba01d82e006a7d9c2fb3aca49a0a8b1e.jpg",
    backdrop: "https://phimimg.com/upload/vod/20250427-1/ba01d82e006a7d9c2fb3aca49a0a8b1e.jpg",
    type: "series",
    sectionTags: ["de-cu", "anime", "phim-bo"],
    quality: "1080",
    language: "Vietsub + Lồng Tiếng",
    duration: "24 phút/tập",
    episodeCurrent: "Trọn Bộ 11 Tập",
    episodeTotal: "11",
    year: 2023,
    rating: 9.5,
    matchScore: 98,
    country: "Nhật Bản",
    countrySlug: "nhat-ban",
    genres: ["Anime", "Hành Động", "Phiêu Lưu", "Kỳ Ảo"],
    director: "Haruo Sotozaki",
    cast: ["Natsuki Hanae", "Katsuyuki Konishi", "Hiro Shimono"],
    ambientColors: ["#db2777", "#9333ea", "#f97316"],
    trailerUrl: "",
    link: "https://phimmoiz.one/thanh-guom-diet-quy-ky-vien-tran/",
    synopsis: "Âm Trụ Uzui Tengen dẫn dắt bộ ba Tanjiro, Zenitsu và Inosuke thâm nhập Kỹ Viện Trấn Yoshiwara hoa lệ để điều tra sự mất tích bí ẩn và đối đầu Thượng Huyền Lục Daki & Gyutaro.",
    episodes: [
      { name: "Tập 01", slug: "tap-01", source: "https://s5.phim1280.tv/20250427/zxn9tgpD/index.m3u8" },
      { name: "Tập 02", slug: "tap-02", source: "https://s5.phim1280.tv/20250427/l0Dkeba4/index.m3u8" },
      { name: "Tập 03", slug: "tap-03", source: "https://s5.phim1280.tv/20250427/kKgSNSQk/index.m3u8" },
      { name: "Tập 04", slug: "tap-04", source: "https://s5.phim1280.tv/20250427/VvUT7Yos/index.m3u8" },
      { name: "Tập 05", slug: "tap-05", source: "https://s5.phim1280.tv/20250427/sL19s4wj/index.m3u8" },
      { name: "Tập 06", slug: "tap-06", source: "https://s5.phim1280.tv/20250427/FXoayT2y/index.m3u8" },
      { name: "Tập 07", slug: "tap-07", source: "https://s5.phim1280.tv/20250427/LIoWkgkj/index.m3u8" },
      { name: "Tập 08", slug: "tap-08", source: "https://s5.phim1280.tv/20250427/Gvx1lVNH/index.m3u8" },
      { name: "Tập 09", slug: "tap-09", source: "https://s5.phim1280.tv/20250427/4vgkcI90/index.m3u8" },
      { name: "Tập 10", slug: "tap-10", source: "https://s5.phim1280.tv/20250427/O5h7hT2X/index.m3u8" },
      { name: "Tập 11", slug: "tap-11", source: "https://s5.phim1280.tv/20250427/yoopRzR8/index.m3u8" }
    ]
  },
  {
    id: "pm-20",
    slug: "chainsaw-man-the-movie-chuong-reze",
    crawlSlug: "chainsaw-man-the-movie-chuong-reze",
    title: "Chainsaw Man - The Movie: Chương Reze",
    originTitle: "Chainsaw Man - The Movie: Reze Arc",
    poster: "https://phimimg.com/upload/vod/20251209-1/69d2d97349877280293f7c1ccc9efdb4.jpg",
    backdrop: "https://phimimg.com/upload/vod/20251209-1/c3096886a37e19947c1b6758f7b8829f.jpg",
    type: "single",
    sectionTags: ["anime", "phim-le", "hot"],
    quality: "1080",
    language: "Vietsub",
    duration: "100 phút",
    episodeCurrent: "Full",
    episodeTotal: "1",
    year: 2025,
    rating: 9.4,
    matchScore: 97,
    country: "Nhật Bản",
    countrySlug: "nhat-ban",
    genres: ["Anime", "Hành Động", "Kỳ Ảo", "Tình Cảm"],
    director: "Tatsuya Yoshihara",
    cast: ["Kikunosuke Toya", "Reina Ueda", "Tomori Kusunoki"],
    ambientColors: ["#a855f7", "#ec4899", "#ef4444"],
    trailerUrl: "",
    link: "https://phimmoiz.one/chainsaw-man-the-movie-chuong-reze/",
    synopsis: "Cuộc gặp gỡ định mệnh dưới cơn mưa giữa Denji và cô gái làm thêm tại quán cà phê tên Reze mở ra một câu chuyện tình lãng mạn nhưng cũng đẫm máu và bùng nổ bậc nhất.",
    episodes: [
      { name: "Full", slug: "full", source: "https://s6.kkphimplayer6.com/20251215/nHBp5YlN/index.m3u8" }
    ]
  },
  {
    id: "pm-21",
    slug: "chu-thuat-hoi-chien-hoai-ngoc-ngoc-chiet-the-movie",
    crawlSlug: "chu-thuat-hoi-chien-hoai-ngoc-ngoc-chiet-the-movie",
    title: "Chú Thuật Hồi Chiến: Hoài Ngọc / Ngọc Chiết",
    originTitle: "JUJUTSU KAISEN: Hidden Inventory / Premature Death",
    poster: "https://phimimg.com/upload/vod/20260109-1/4e4d8423fc6430a5068ec9aad53b9ead.jpg",
    backdrop: "https://phimimg.com/upload/vod/20260109-1/dc1ee67bc00ae06dd19314078cf5d2de.jpg",
    type: "single",
    sectionTags: ["anime", "phim-le"],
    quality: "1080",
    language: "Vietsub",
    duration: "111 phút",
    episodeCurrent: "Full",
    episodeTotal: "1",
    year: 2025,
    rating: 9.3,
    matchScore: 96,
    country: "Nhật Bản",
    countrySlug: "nhat-ban",
    genres: ["Anime", "Hành Động", "Kỳ Ảo"],
    director: "Shota Goshozono",
    cast: ["Yuichi Nakamura", "Takahiro Sakurai", "Takehito Koyasu"],
    ambientColors: ["#0ea5e9", "#6366f1", "#ec4899"],
    trailerUrl: "",
    link: "https://phimmoiz.one/chu-thuat-hoi-chien-hoai-ngoc-ngoc-chiet-the-movie/",
    synopsis: "Thời thanh xuân rực rỡ nhưng bi thương của bộ đôi mạnh nhất Satoru Gojo và Suguru Geto trong nhiệm vụ hộ tống Tinh Tương Thể Riko Amanai trước sát thủ Toji Fushiguro.",
    episodes: [
      { name: "Tập 01", slug: "tap-01", source: "https://s4.phim1280.tv/20241110/AtmjbrBk/index.m3u8" },
      { name: "Tập 02", slug: "tap-02", source: "https://s4.phim1280.tv/20241110/hoMNvwJ9/index.m3u8" },
      { name: "Tập 03", slug: "tap-03", source: "https://s4.phim1280.tv/20241110/I4VdX7Ns/index.m3u8" },
      { name: "Tập 04", slug: "tap-04", source: "https://s4.phim1280.tv/20241110/Ie3zaR3B/index.m3u8" },
      { name: "Tập 05", slug: "tap-05", source: "https://s4.phim1280.tv/20241110/rMFqCSLj/index.m3u8" }
    ]
  },
  {
    id: "pm-22",
    slug: "phi-vu-dong-troi-2",
    crawlSlug: "phi-vu-dong-troi-2",
    title: "Phi Vụ Động Trời 2",
    originTitle: "Zootopia 2",
    poster: "https://phimimg.com/upload/vod/20251223-1/6bc1d549b86e490274d93bab66a3654d.jpg",
    backdrop: "https://phimimg.com/upload/vod/20251223-1/7154384c306c73664e46942f2477e574.jpg",
    type: "single",
    sectionTags: ["anime", "au-my", "phim-le", "hot"],
    quality: "1080",
    language: "Vietsub + Lồng Tiếng",
    duration: "100 phút",
    episodeCurrent: "Full",
    episodeTotal: "1",
    year: 2025,
    rating: 9.1,
    matchScore: 95,
    country: "Âu Mỹ",
    countrySlug: "au-my",
    genres: ["Hoạt Hình", "Phiêu Lưu", "Hài Hước", "Gia Đình"],
    director: "Jared Bush, Byron Howard",
    cast: ["Ginnifer Goodwin", "Jason Bateman", "Ke Huy Quan"],
    ambientColors: ["#f97316", "#3b82f6", "#10b981"],
    trailerUrl: "",
    link: "https://phimmoiz.one/phi-vu-dong-troi-2/",
    synopsis: "Cặp bài trùng cảnh sát thỏ Judy Hopps và cáo Nick Wilde tái hợp trong một vụ án bí ẩn liên quan đến cư dân bò sát mới xuất hiện làm đảo lộn thành phố Zootopia.",
    episodes: [
      { name: "Full", slug: "full", source: "https://s6.kkphimplayer6.com/20260127/mK4C03bs/index.m3u8" }
    ]
  },
  {
    id: "pm-23",
    slug: "100-ngay-lua-doi",
    crawlSlug: "100-ngay-lua-doi",
    title: "100 Ngày Lừa Dối",
    originTitle: "100 Days Of Deception",
    poster: "https://phimimg.com/uploads/movies/20261011/100-ngay-lua-doi-poster.webp",
    backdrop: "https://phimimg.com/uploads/movies/20261011/100-ngay-lua-doi-thumb.webp",
    type: "series",
    sectionTags: ["hot", "phim-bo", "han-quoc"],
    quality: "1080",
    language: "Vietsub",
    duration: "74 phút/tập",
    episodeCurrent: "Tập 4 / 12",
    episodeTotal: "12",
    year: 2026,
    rating: 8.7,
    matchScore: 93,
    country: "Hàn Quốc",
    countrySlug: "han-quoc",
    genres: ["Tình Cảm", "Chính Kịch", "Bí Ẩn"],
    director: "Park Jin-woo",
    cast: ["Kim Ji-won", "Lee Do-hyun"],
    ambientColors: ["#f43f5e", "#8b5cf6", "#06b6d4"],
    trailerUrl: "",
    link: "https://phimmoiz.one/100-ngay-lua-doi/",
    synopsis: "Bản hợp đồng hôn nhân 100 ngày đầy những lời nói dối tinh vi giữa hai kẻ mang mục tiêu trả thù riêng, nhưng lại dẫn đến rung động thật sự không thể kiểm soát.",
    episodes: [
      { name: "Tập 01", slug: "tap-01", source: "https://a.kvp726.com/20261010/B9EF5CgO/index.m3u8" },
      { name: "Tập 02", slug: "tap-02", source: "https://a.kvp726.com/20261011/sZyaJ3YB/index.m3u8" },
      { name: "Tập 03", slug: "tap-03", source: "https://a.kvp726.com/20261017/Rig0e5hF/index.m3u8" },
      { name: "Tập 04", slug: "tap-04", source: "https://a.kvp726.com/20261018/pQ7S2FCd/index.m3u8" },
      { name: "Tập 05", slug: "tap-05", source: "https://a.kvp726.com/20261024/klziRtPi/index.m3u8" },
      { name: "Tập 06", slug: "tap-06", source: "https://a.kvp726.com/20261025/DUGCAW46/index.m3u8" },
      { name: "Tập 07", slug: "tap-07", source: "https://a.kvp726.com/20261101/Aoo4MLtQ/index.m3u8" },
      { name: "Tập 08", slug: "tap-08", source: "https://a.kvp726.com/20261102/xN5hEbOX/index.m3u8" },
      { name: "Tập 09", slug: "tap-09", source: "https://a.kvp726.com/20261108/Pfz7iBAs/index.m3u8" },
      { name: "Tập 10", slug: "tap-10", source: "https://a.kvp726.com/20261109/Mm1pchEQ/index.m3u8" },
      { name: "Tập 11", slug: "tap-11", source: "https://a.kvp726.com/20261115/iysU4zyZ/index.m3u8" },
      { name: "Tập 12", slug: "tap-12", source: "https://a.kvp726.com/20261117/8II2N6fD/index.m3u8" }
    ]
  },
  {
    id: "pm-24",
    slug: "ngoc-diem-thu",
    crawlSlug: "ngoc-diem-thu",
    title: "Ngọc Điệm Thu",
    originTitle: "The Lament Of Autumn",
    poster: "https://phimimg.com/uploads/movies/20261012/ngoc-diem-thu-poster.webp",
    backdrop: "https://phimimg.com/uploads/movies/20261012/ngoc-diem-thu-thumb.webp",
    type: "series",
    sectionTags: ["hot", "phim-bo", "trung-quoc"],
    quality: "1080",
    language: "Vietsub + Thuyết Minh",
    duration: "44 phút/tập",
    episodeCurrent: "Tập 19 / 32",
    episodeTotal: "32",
    year: 2026,
    rating: 8.8,
    matchScore: 94,
    country: "Trung Quốc",
    countrySlug: "trung-quoc",
    genres: ["Cổ Trang", "Tình Cảm", "Chính Kịch"],
    director: "Chu Duẫn",
    cast: ["Thừa Lỗi", "Từ Nhược Hàm"],
    ambientColors: ["#d97706", "#b91c1c", "#4338ca"],
    trailerUrl: "",
    link: "https://phimmoiz.one/ngoc-diem-thu/",
    synopsis: "Câu chuyện tình yêu đầy bi thương và quyền mưu giữa thời loạn thế, nơi lòng trung thành và tình yêu bị đặt lên bàn cân sinh tử.",
    episodes: [
      { name: "Tập 01", slug: "tap-01", source: "https://a.kvp726.com/20261012/569x0bWN/index.m3u8" },
      { name: "Tập 02", slug: "tap-02", source: "https://a.kvp726.com/20261012/vicUv73G/index.m3u8" },
      { name: "Tập 03", slug: "tap-03", source: "https://a.kvp726.com/20261012/9Qb4VloN/index.m3u8" },
      { name: "Tập 04", slug: "tap-04", source: "https://a.kvp726.com/20261013/7b8qVmvR/index.m3u8" },
      { name: "Tập 05", slug: "tap-05", source: "https://a.kvp726.com/20261013/vdg47y2s/index.m3u8" },
      { name: "Tập 06", slug: "tap-06", source: "https://a.kvp726.com/20261014/Jq0pUKfy/index.m3u8" },
      { name: "Tập 07", slug: "tap-07", source: "https://a.kvp726.com/20261014/2XJRCm65/index.m3u8" },
      { name: "Tập 08", slug: "tap-08", source: "https://a.kvp726.com/20261015/yuz3b77L/index.m3u8" },
      { name: "Tập 09", slug: "tap-09", source: "https://a.kvp726.com/20261015/7AGAEG3O/index.m3u8" },
      { name: "Tập 10", slug: "tap-10", source: "https://a.kvp726.com/20261018/gGy0kEYl/index.m3u8" },
      { name: "Tập 11", slug: "tap-11", source: "https://a.kvp726.com/20261018/ksUNozgc/index.m3u8" },
      { name: "Tập 12", slug: "tap-12", source: "https://a.kvp726.com/20261018/baeX1FJy/index.m3u8" },
      { name: "Tập 13", slug: "tap-13", source: "https://a.kvp726.com/20261020/v8I7ca2i/index.m3u8" },
      { name: "Tập 14", slug: "tap-14", source: "https://a.kvp726.com/20261020/ju0G3D4C/index.m3u8" },
      { name: "Tập 15", slug: "tap-15", source: "https://a.kvp726.com/20261020/IUdcYcSG/index.m3u8" },
      { name: "Tập 16", slug: "tap-16", source: "https://a.kvp726.com/20261020/RjoKMwFw/index.m3u8" },
      { name: "Tập 17", slug: "tap-17", source: "https://a.kvp726.com/20261021/4ynsaD64/index.m3u8" },
      { name: "Tập 18", slug: "tap-18", source: "https://a.kvp726.com/20261021/xvx6PuKA/index.m3u8" },
      { name: "Tập 19", slug: "tap-19", source: "https://a.kvp726.com/20261022/n48mI2rP/index.m3u8" },
      { name: "Tập 20", slug: "tap-20", source: "https://a.kvp726.com/20261022/hSAKVZyy/index.m3u8" },
      { name: "Tập 21", slug: "tap-21", source: "https://a.kvp726.com/20261023/rdesFcQB/index.m3u8" },
      { name: "Tập 22", slug: "tap-22", source: "https://a.kvp726.com/20261024/6mwCBTz1/index.m3u8" },
      { name: "Tập 23", slug: "tap-23", source: "https://a.kvp726.com/20261025/myX7mUqs/index.m3u8" },
      { name: "Tập 24", slug: "tap-24", source: "https://a.kvp726.com/20261026/l7Mu1QXp/index.m3u8" },
      { name: "Tập 25", slug: "tap-25", source: "https://a.kvp726.com/20261026/beAV3mc3/index.m3u8" },
      { name: "Tập 26", slug: "tap-26", source: "https://a.kvp726.com/20261027/ilGdgPAC/index.m3u8" },
      { name: "Tập 27", slug: "tap-27", source: "https://a.kvp726.com/20261027/TCHo89vV/index.m3u8" },
      { name: "Tập 28", slug: "tap-28", source: "https://a.kvp726.com/20261028/czlUCoK2/index.m3u8" },
      { name: "Tập 29", slug: "tap-29", source: "https://a.kvp726.com/20261028/ZiJlavXO/index.m3u8" },
      { name: "Tập 30", slug: "tap-30", source: "https://a.kvp726.com/20261029/zJD7EokM/index.m3u8" },
      { name: "Tập 31", slug: "tap-31", source: "https://a.kvp726.com/20261031/sTNCE73T/index.m3u8" },
      { name: "Tập 32", slug: "tap-32", source: "https://a.kvp726.com/20261101/xokuRiXi/index.m3u8" },
      { name: "Tập 33", slug: "tap-33", source: "https://a.kvp726.com/20261101/QhCLecbk/index.m3u8" },
      { name: "Tập 34", slug: "tap-34", source: "https://a.kvp726.com/20261101/k9dv5Ka7/index.m3u8" },
      { name: "Tập 35", slug: "tap-35", source: "https://a.kvp726.com/20261102/mQxvWthJ/index.m3u8" },
      { name: "Tập 36", slug: "tap-36", source: "https://a.kvp726.com/20261103/bwI5XUvA/index.m3u8" },
      { name: "Tập 37", slug: "tap-37", source: "https://a.kvp726.com/20261105/E5kk0zJH/index.m3u8" },
      { name: "Tập 38", slug: "tap-38", source: "https://a.kvp726.com/20261105/dtrmOo65/index.m3u8" },
      { name: "Tập 39", slug: "tap-39", source: "https://a.kvp726.com/20261106/bvnG61bF/index.m3u8" },
      { name: "Tập 40", slug: "tap-40", source: "https://a.kvp726.com/20261107/2SgrGwgi/index.m3u8" }
    ]
  },
  {
    id: "pm-25",
    slug: "my-nhan-du",
    crawlSlug: "my-nhan-du",
    title: "Mỹ Nhân Dư",
    originTitle: "The Vanishing Beauty",
    poster: "https://phimimg.com/uploads/movies/20261010/my-nhan-du-poster.webp",
    backdrop: "https://phimimg.com/uploads/movies/20261010/my-nhan-du-thumb.webp",
    type: "series",
    sectionTags: ["hot", "phim-bo", "trung-quoc"],
    quality: "1080",
    language: "Vietsub",
    duration: "47 phút/tập",
    episodeCurrent: "Tập 23 / 36",
    episodeTotal: "36",
    year: 2026,
    rating: 8.6,
    matchScore: 91,
    country: "Trung Quốc",
    countrySlug: "trung-quoc",
    genres: ["Tâm Lý", "Tình Cảm", "Bí Ẩn"],
    director: "Lý Mộc Qua",
    cast: ["Lý Nhất Đồng", "Vương Tuấn Khải"],
    ambientColors: ["#ec4899", "#6366f1", "#14b8a6"],
    trailerUrl: "",
    link: "https://phimmoiz.one/my-nhan-du/",
    synopsis: "Hành trình tìm lại bản ngã và vạch trần sự thật đằng sau những hào quang giả tạo của bốn người phụ nữ có số phận gắn kết chặt chẽ.",
    episodes: [
      { name: "Tập 01", slug: "tap-01", source: "https://a.kvp726.com/20261009/DOayayaG/index.m3u8" },
      { name: "Tập 02", slug: "tap-02", source: "https://a.kvp726.com/20261009/IOxU28i9/index.m3u8" },
      { name: "Tập 03", slug: "tap-03", source: "https://a.kvp726.com/20261009/OT76MbxV/index.m3u8" },
      { name: "Tập 04", slug: "tap-04", source: "https://a.kvp726.com/20261010/iNawC2v0/index.m3u8" },
      { name: "Tập 05", slug: "tap-05", source: "https://a.kvp726.com/20261010/TxRFI76J/index.m3u8" },
      { name: "Tập 06", slug: "tap-06", source: "https://a.kvp726.com/20261011/RDSGvhaH/index.m3u8" },
      { name: "Tập 07", slug: "tap-07", source: "https://a.kvp726.com/20261011/TJ0MYUYi/index.m3u8" },
      { name: "Tập 08", slug: "tap-08", source: "https://a.kvp726.com/20261012/UVA1bqYW/index.m3u8" },
      { name: "Tập 09", slug: "tap-09", source: "https://a.kvp726.com/20261012/xxJ7KyzI/index.m3u8" },
      { name: "Tập 10", slug: "tap-10", source: "https://a.kvp726.com/20261013/TJLicwvx/index.m3u8" },
      { name: "Tập 11", slug: "tap-11", source: "https://a.kvp726.com/20261013/ExKNUnW7/index.m3u8" },
      { name: "Tập 12", slug: "tap-12", source: "https://a.kvp726.com/20261014/ps83IG2M/index.m3u8" },
      { name: "Tập 13", slug: "tap-13", source: "https://a.kvp726.com/20261014/NqNVnj2y/index.m3u8" },
      { name: "Tập 14", slug: "tap-14", source: "https://a.kvp726.com/20261015/XHGxrgtt/index.m3u8" },
      { name: "Tập 15", slug: "tap-15", source: "https://a.kvp726.com/20261015/LK7TayvQ/index.m3u8" },
      { name: "Tập 16", slug: "tap-16", source: "https://a.kvp726.com/20261016/dhqrnjLH/index.m3u8" },
      { name: "Tập 17", slug: "tap-17", source: "https://a.kvp726.com/20261016/g88OaViv/index.m3u8" },
      { name: "Tập 18", slug: "tap-18", source: "https://a.kvp726.com/20261018/9YFCqTMo/index.m3u8" },
      { name: "Tập 19", slug: "tap-19", source: "https://a.kvp726.com/20261018/MZFcWDzd/index.m3u8" },
      { name: "Tập 20", slug: "tap-20", source: "https://a.kvp726.com/20261018/kA00QrQv/index.m3u8" },
      { name: "Tập 21", slug: "tap-21", source: "https://a.kvp726.com/20261018/sbyDVl82/index.m3u8" },
      { name: "Tập 22", slug: "tap-22", source: "https://a.kvp726.com/20261020/dGCYv6q5/index.m3u8" },
      { name: "Tập 23", slug: "tap-23", source: "https://a.kvp726.com/20261020/avQXBJJG/index.m3u8" },
      { name: "Tập 24", slug: "tap-24", source: "https://a.kvp726.com/20261024/MuWpcCWY/index.m3u8" },
      { name: "Tập 25", slug: "tap-25", source: "https://a.kvp726.com/20261025/QneDGv1S/index.m3u8" },
      { name: "Tập 26", slug: "tap-26", source: "https://a.kvp726.com/20261026/DytEYO6Y/index.m3u8" },
      { name: "Tập 27", slug: "tap-27", source: "https://a.kvp726.com/20261027/OyiqMWma/index.m3u8" },
      { name: "Tập 28", slug: "tap-28", source: "https://a.kvp726.com/20261028/OjXUV8wL/index.m3u8" }
    ]
  },
  {
    id: "pm-26",
    slug: "cuoc-goi-khan-cap-9-1-1-phan-9",
    crawlSlug: "cuoc-goi-khan-cap-9-1-1-phan-9",
    title: "Cuộc Gọi Khẩn Cấp 9-1-1 (Phần 9)",
    originTitle: "9-1-1 (Season 9)",
    poster: "https://phimimg.com/uploads/movies/20260815/cuoc-goi-khan-cap-9-1-1-phan-9-poster.webp",
    backdrop: "https://phimimg.com/uploads/movies/20260815/cuoc-goi-khan-cap-9-1-1-phan-9-thumb.webp",
    type: "series",
    sectionTags: ["hot", "phim-bo", "au-my"],
    quality: "1080",
    language: "Vietsub",
    duration: "45 phút/tập",
    episodeCurrent: "Tập 14 / 18",
    episodeTotal: "18",
    year: 2026,
    rating: 8.9,
    matchScore: 94,
    country: "Âu Mỹ",
    countrySlug: "au-my",
    genres: ["Hành Động", "Chính Kịch", "Hình Sự"],
    director: "Ryan Murphy",
    cast: ["Angela Bassett", "Peter Krause", "Jennifer Love Hewitt", "Oliver Stark"],
    ambientColors: ["#ef4444", "#3b82f6", "#f59e0b"],
    trailerUrl: "",
    link: "https://phimmoiz.one/cuoc-goi-khan-cap-9-1-1-phan-9/",
    synopsis: "Những người lính cứu hỏa, cảnh sát và nhân viên tổng đài cứu hộ Los Angeles tiếp tục đối mặt với những thảm họa nghẹt thở và căng thẳng tột độ.",
    episodes: [
      { name: "Tập 01", slug: "tap-01", source: "https://v7.kkphimplayer7.com/20260817/ZTJCTraD/index.m3u8" },
      { name: "Tập 02", slug: "tap-02", source: "https://v7.kkphimplayer7.com/20260817/5GxP9WCT/index.m3u8" },
      { name: "Tập 03", slug: "tap-03", source: "https://v7.kkphimplayer7.com/20260818/g8lskctB/index.m3u8" },
      { name: "Tập 04", slug: "tap-04", source: "https://v7.kkphimplayer7.com/20260818/RF660rwc/index.m3u8" },
      { name: "Tập 05", slug: "tap-05", source: "https://v7.kkphimplayer7.com/20260822/j4uscNO2/index.m3u8" },
      { name: "Tập 06", slug: "tap-06", source: "https://v7.kkphimplayer7.com/20260822/DKzf7YNn/index.m3u8" },
      { name: "Tập 07", slug: "tap-07", source: "https://v7.kkphimplayer7.com/20260822/F0NSyJr0/index.m3u8" },
      { name: "Tập 08", slug: "tap-08", source: "https://v7.kkphimplayer7.com/20260822/JYcySxaW/index.m3u8" },
      { name: "Tập 09", slug: "tap-09", source: "https://v7.kkphimplayer7.com/20260827/WvW649UA/index.m3u8" },
      { name: "Tập 10", slug: "tap-10", source: "https://v7.kkphimplayer7.com/20260827/ETqoaFJJ/index.m3u8" },
      { name: "Tập 11", slug: "tap-11", source: "https://v7.kkphimplayer7.com/20260906/HceH5M78/index.m3u8" },
      { name: "Tập 12", slug: "tap-12", source: "https://v7.kkphimplayer7.com/20260917/PmRI4Esy/index.m3u8" },
      { name: "Tập 13", slug: "tap-13", source: "https://a.kvp726.com/20261014/jFLOv2sk/index.m3u8" },
      { name: "Tập 14", slug: "tap-14", source: "https://a.kvp726.com/20261016/8JeEzH4W/index.m3u8" },
      { name: "Tập 15", slug: "tap-15", source: "https://a.kvp726.com/20261106/kuSC8M3J/index.m3u8" },
      { name: "Tập 16", slug: "tap-16", source: "https://a.kvp726.com/20261106/iNmkAx0Z/index.m3u8" },
      { name: "Tập 17", slug: "tap-17", source: "https://a.kvp726.com/20261106/r8bEJ5DP/index.m3u8" },
      { name: "Tập 18", slug: "tap-18", source: "https://a.kvp726.com/20261106/gP9hJEOl/index.m3u8" }
    ]
  },
  {
    id: "pm-27",
    slug: "cu-roi-tu-than-2-diem-chet",
    crawlSlug: "cu-roi-tu-than-2-diem-chet",
    title: "Cú Rơi Tử Thần 2: Điểm Chết",
    originTitle: "Fall 2: Deadpoint",
    poster: "https://phimimg.com/uploads/movies/20261010/cu-roi-tu-than-2-diem-chet-poster.webp",
    backdrop: "https://phimimg.com/uploads/movies/20261010/cu-roi-tu-than-2-diem-chet-thumb.webp",
    type: "single",
    sectionTags: ["hot", "phim-le", "au-my"],
    quality: "1080",
    language: "Vietsub",
    duration: "98 phút",
    episodeCurrent: "Full",
    episodeTotal: "1",
    year: 2026,
    rating: 8.4,
    matchScore: 92,
    country: "Âu Mỹ",
    countrySlug: "au-my",
    genres: ["Giật Gân", "Phiêu Lưu", "Tâm Lý"],
    director: "Michael & Peter Spierig",
    cast: ["Harriet Slater", "Arsema Thomas"],
    ambientColors: ["#f97316", "#0284c7", "#475569"],
    trailerUrl: "",
    link: "https://phimmoiz.one/cu-roi-tu-than-2-diem-chet/",
    synopsis: "Tiếp nối nỗi ám ảnh độ cao nghẹt thở, phần 2 đưa người xem lên một cấu trúc chọc trời cô lập giữa thiên nhiên khắc nghiệt nơi một sai lầm nhỏ đồng nghĩa với cái chết.",
    episodes: [
      { name: "Full", slug: "full", source: "https://a.kvp726.com/20261009/hB5CqPfh/index.m3u8" }
    ]
  },
  {
    id: "pm-28",
    slug: "pha-dam-sinh-nhat-me",
    crawlSlug: "pha-dam-sinh-nhat-me",
    title: "Phá Đám: Sinh Nhật Mẹ",
    originTitle: "Spoiled: Mom's Birthday Party",
    poster: "https://phimimg.com/upload/vod/20260517-1/cf6c033ac490be0f8414ce3abadf4246.jpg",
    backdrop: "https://phimimg.com/upload/vod/20260517-1/ad67ffa5d2d07e1566bb07f27bdeb123.jpg",
    type: "single",
    sectionTags: ["hot", "phim-le", "viet-nam"],
    quality: "1080",
    language: "Vietsub",
    duration: "91 phút",
    episodeCurrent: "Full",
    episodeTotal: "1",
    year: 2026,
    rating: 8.5,
    matchScore: 93,
    country: "Việt Nam",
    countrySlug: "viet-nam",
    genres: ["Gia Đình", "Hài Hước", "Tâm Lý"],
    director: "Nguyễn Thanh Bình",
    cast: ["NSƯT Thành Hội", "Ái Như", "Trần Kim Hải"],
    ambientColors: ["#f43f5e", "#f59e0b", "#8b5cf6"],
    trailerUrl: "",
    link: "https://phimmoiz.one/pha-dam-sinh-nhat-me/",
    synopsis: "Buổi tiệc sinh nhật tưởng chừng ấm cúng của người mẹ bất ngờ trở thành tâm điểm của hàng loạt tình huống dở khóc dở cười khi những bí mật giấu kín của các thành viên trong gia đình bị phơi bày.",
    episodes: [
      { name: "Full", slug: "full", source: "https://a.kvp726.com/20261001/Iw5yJa3S/index.m3u8" }
    ]
  },
  {
    id: "pm-29",
    slug: "cam-nguyet-nhu-ca",
    crawlSlug: "cam-nguyet-nhu-ca",
    title: "Cẩm Nguyệt Như Ca",
    originTitle: "Legend Of The Female General",
    poster: "https://phimimg.com/upload/vod/20250806-1/eaa856bf1bf6e28c17ebafdc2283f8ad.jpg",
    backdrop: "https://phimimg.com/upload/vod/20250806-1/0d83ca81d2ed84f40d0979bd3a6c496f.jpg",
    type: "series",
    sectionTags: ["de-cu", "trung-quoc", "phim-bo"],
    quality: "1080",
    language: "Vietsub + Thuyết Minh",
    duration: "45 phút/tập",
    episodeCurrent: "Trọn Bộ 36 Tập",
    episodeTotal: "36",
    year: 2025,
    rating: 9.0,
    matchScore: 95,
    country: "Trung Quốc",
    countrySlug: "trung-quoc",
    genres: ["Cổ Trang", "Hành Động", "Tình Cảm"],
    director: "Tưởng Gia Tuấn",
    cast: ["Châu Dã", "Thừa Lỗi", "Trương Khang Lạc"],
    ambientColors: ["#dc2626", "#ca8a04", "#1d4ed8"],
    trailerUrl: "",
    link: "https://phimmoiz.one/cam-nguyet-nhu-ca/",
    synopsis: "Nữ tướng quân Hòa Yến cải trang nam nhi ra trận lập chiến công hiển hách nhưng bị gia tộc phản bội. Sống lại dưới thân phận mới, nàng một lần nữa khoác chiến giáp đòi lại công đạo cùng Tiêu Giác.",
    episodes: [
      { name: "Tập 01", slug: "tap-01", source: "https://s6.kkphimplayer6.com/20250806/gI65ZsMW/index.m3u8" },
      { name: "Tập 02", slug: "tap-02", source: "https://s6.kkphimplayer6.com/20250806/V6zFVgon/index.m3u8" },
      { name: "Tập 03", slug: "tap-03", source: "https://s6.kkphimplayer6.com/20250806/x6orbc6O/index.m3u8" },
      { name: "Tập 04", slug: "tap-04", source: "https://s6.kkphimplayer6.com/20250806/3V0Km7T2/index.m3u8" },
      { name: "Tập 05", slug: "tap-05", source: "https://s6.kkphimplayer6.com/20250807/34tHr4Vq/index.m3u8" },
      { name: "Tập 06", slug: "tap-06", source: "https://s6.kkphimplayer6.com/20250810/PIzWPH2L/index.m3u8" },
      { name: "Tập 07", slug: "tap-07", source: "https://s6.kkphimplayer6.com/20250808/50OhG5zW/index.m3u8" },
      { name: "Tập 08", slug: "tap-08", source: "https://s6.kkphimplayer6.com/20250808/W6iMjSSU/index.m3u8" },
      { name: "Tập 09", slug: "tap-09", source: "https://s6.kkphimplayer6.com/20250809/Ro57ogvu/index.m3u8" },
      { name: "Tập 10", slug: "tap-10", source: "https://s6.kkphimplayer6.com/20250809/1Hg0zM0I/index.m3u8" },
      { name: "Tập 11", slug: "tap-11", source: "https://s6.kkphimplayer6.com/20250809/NhZgDtfi/index.m3u8" },
      { name: "Tập 12", slug: "tap-12", source: "https://s6.kkphimplayer6.com/20250810/3Z9mOV53/index.m3u8" },
      { name: "Tập 13", slug: "tap-13", source: "https://s6.kkphimplayer6.com/20250810/P1SlKGGx/index.m3u8" },
      { name: "Tập 14", slug: "tap-14", source: "https://s6.kkphimplayer6.com/20250811/0LWNUFZj/index.m3u8" },
      { name: "Tập 15", slug: "tap-15", source: "https://s6.kkphimplayer6.com/20250811/eB3da40y/index.m3u8" },
      { name: "Tập 16", slug: "tap-16", source: "https://s6.kkphimplayer6.com/20250812/mhoT3BNY/index.m3u8" },
      { name: "Tập 17", slug: "tap-17", source: "https://s6.kkphimplayer6.com/20250812/UQhGPzIR/index.m3u8" },
      { name: "Tập 18", slug: "tap-18", source: "https://s6.kkphimplayer6.com/20250813/6h2IiiXI/index.m3u8" },
      { name: "Tập 19", slug: "tap-19", source: "https://s6.kkphimplayer6.com/20250813/Or6GRZDV/index.m3u8" },
      { name: "Tập 20", slug: "tap-20", source: "https://s6.kkphimplayer6.com/20250814/7a2eWkAI/index.m3u8" },
      { name: "Tập 21", slug: "tap-21", source: "https://s6.kkphimplayer6.com/20250814/J1m3ORGm/index.m3u8" },
      { name: "Tập 22", slug: "tap-22", source: "https://s6.kkphimplayer6.com/20250815/Dp1BV9Yx/index.m3u8" },
      { name: "Tập 23", slug: "tap-23", source: "https://s6.kkphimplayer6.com/20250815/dzV3xdZx/index.m3u8" },
      { name: "Tập 24", slug: "tap-24", source: "https://s6.kkphimplayer6.com/20250816/CotkDNw6/index.m3u8" },
      { name: "Tập 25", slug: "tap-25", source: "https://s6.kkphimplayer6.com/20250816/6FiGOnBy/index.m3u8" },
      { name: "Tập 26", slug: "tap-26", source: "https://s6.kkphimplayer6.com/20250817/CKgsbdNk/index.m3u8" },
      { name: "Tập 27", slug: "tap-27", source: "https://s6.kkphimplayer6.com/20250818/b4b82j2N/index.m3u8" },
      { name: "Tập 28", slug: "tap-28", source: "https://s6.kkphimplayer6.com/20250818/rDAgJRqn/index.m3u8" },
      { name: "Tập 29", slug: "tap-29", source: "https://s6.kkphimplayer6.com/20250819/dBJcMoMB/index.m3u8" },
      { name: "Tập 30", slug: "tap-30", source: "https://s6.kkphimplayer6.com/20250819/Qdc6g7aN/index.m3u8" },
      { name: "Tập 31", slug: "tap-31", source: "https://s6.kkphimplayer6.com/20250820/Gmmp73jF/index.m3u8" },
      { name: "Tập 32", slug: "tap-32", source: "https://s6.kkphimplayer6.com/20250820/UgeTXoDU/index.m3u8" },
      { name: "Tập 33", slug: "tap-33", source: "https://s6.kkphimplayer6.com/20250820/YL5exfxA/index.m3u8" },
      { name: "Tập 34", slug: "tap-34", source: "https://s6.kkphimplayer6.com/20250820/flLFl9CQ/index.m3u8" },
      { name: "Tập 35", slug: "tap-35", source: "https://s6.kkphimplayer6.com/20250820/jkGvJcvp/index.m3u8" },
      { name: "Tập 36", slug: "tap-36", source: "https://s6.kkphimplayer6.com/20250820/U0POd0Bo/index.m3u8" }
    ]
  },
  {
    id: "pm-30",
    slug: "trieu-tuyet-luc",
    crawlSlug: "trieu-tuyet-luc",
    title: "Triều Tuyết Lục",
    originTitle: "Coroner's Diary",
    poster: "https://phimimg.com/upload/vod/20250713-1/464d72c09e1e3934b2bf37d7e6afdf4c.jpg",
    backdrop: "https://phimimg.com/upload/vod/20250713-1/49c56c1f733ed8a328dc7984df495075.jpg",
    type: "series",
    sectionTags: ["de-cu", "trung-quoc", "phim-bo"],
    quality: "1080",
    language: "Vietsub + Thuyết Minh",
    duration: "45 phút/tập",
    episodeCurrent: "Trọn Bộ 38 Tập",
    episodeTotal: "38",
    year: 2025,
    rating: 8.9,
    matchScore: 94,
    country: "Trung Quốc",
    countrySlug: "trung-quoc",
    genres: ["Cổ Trang", "Bí Ẩn", "Tình Cảm"],
    director: "Lý Tuệ Chu",
    cast: ["Lý Lan Địch", "Ngao Thụy Bằng"],
    ambientColors: ["#38bdf8", "#818cf8", "#f43f5e"],
    trailerUrl: "",
    link: "https://phimmoiz.one/trieu-tuyet-luc/",
    synopsis: "Nữ ngỗ tác tài ba Thẩm Hoàn dùng y thuật và khả năng nghiệm thi sắc bén phối hợp cùng Thế tử Yên Trì giải mã hàng loạt vụ kỳ án chấn động triều đình.",
    episodes: [
      { name: "Tập 01", slug: "tap-01", source: "https://s6.kkphimplayer6.com/20250713/FRfQyIST/index.m3u8" },
      { name: "Tập 02", slug: "tap-02", source: "https://s6.kkphimplayer6.com/20250713/6hENZeKh/index.m3u8" },
      { name: "Tập 03", slug: "tap-03", source: "https://s6.kkphimplayer6.com/20250713/gpOMLu7z/index.m3u8" },
      { name: "Tập 04", slug: "tap-04", source: "https://s6.kkphimplayer6.com/20250713/0HxRAqUY/index.m3u8" },
      { name: "Tập 05", slug: "tap-05", source: "https://s6.kkphimplayer6.com/20250713/WQDpJlun/index.m3u8" },
      { name: "Tập 06", slug: "tap-06", source: "https://s6.kkphimplayer6.com/20250713/St0PzIOf/index.m3u8" },
      { name: "Tập 07", slug: "tap-07", source: "https://s6.kkphimplayer6.com/20250714/pd6Wdi5R/index.m3u8" },
      { name: "Tập 08", slug: "tap-08", source: "https://s6.kkphimplayer6.com/20250714/zXVHGiQl/index.m3u8" },
      { name: "Tập 09", slug: "tap-09", source: "https://s6.kkphimplayer6.com/20250715/JsVi4mpi/index.m3u8" },
      { name: "Tập 10", slug: "tap-10", source: "https://s6.kkphimplayer6.com/20250715/oapn51Fp/index.m3u8" },
      { name: "Tập 11", slug: "tap-11", source: "https://s6.kkphimplayer6.com/20250716/gUvqZApG/index.m3u8" },
      { name: "Tập 12", slug: "tap-12", source: "https://s6.kkphimplayer6.com/20250716/858o8ht2/index.m3u8" },
      { name: "Tập 13", slug: "tap-13", source: "https://s6.kkphimplayer6.com/20250717/MRE4HcK5/index.m3u8" },
      { name: "Tập 14", slug: "tap-14", source: "https://s6.kkphimplayer6.com/20250717/RaZYvmds/index.m3u8" },
      { name: "Tập 15", slug: "tap-15", source: "https://s6.kkphimplayer6.com/20250718/QxHOf44K/index.m3u8" },
      { name: "Tập 16", slug: "tap-16", source: "https://s6.kkphimplayer6.com/20250718/HUkcztml/index.m3u8" },
      { name: "Tập 17", slug: "tap-17", source: "https://s6.kkphimplayer6.com/20250719/Ds7rsaYc/index.m3u8" },
      { name: "Tập 18", slug: "tap-18", source: "https://s6.kkphimplayer6.com/20250719/RwTuN3EV/index.m3u8" },
      { name: "Tập 19", slug: "tap-19", source: "https://s6.kkphimplayer6.com/20250720/geHaVKgI/index.m3u8" },
      { name: "Tập 20", slug: "tap-20", source: "https://s6.kkphimplayer6.com/20250720/tOsOgKDt/index.m3u8" },
      { name: "Tập 21", slug: "tap-21", source: "https://s6.kkphimplayer6.com/20250721/2P5MEjkL/index.m3u8" },
      { name: "Tập 22", slug: "tap-22", source: "https://s6.kkphimplayer6.com/20250721/hulQmx0I/index.m3u8" },
      { name: "Tập 23", slug: "tap-23", source: "https://s6.kkphimplayer6.com/20250722/NhwAzJUT/index.m3u8" },
      { name: "Tập 24", slug: "tap-24", source: "https://s6.kkphimplayer6.com/20250722/SZ9Ziqqu/index.m3u8" },
      { name: "Tập 25", slug: "tap-25", source: "https://s6.kkphimplayer6.com/20250723/7cLTaws7/index.m3u8" },
      { name: "Tập 26", slug: "tap-26", source: "https://s6.kkphimplayer6.com/20250723/TksphK2n/index.m3u8" },
      { name: "Tập 27", slug: "tap-27", source: "https://s6.kkphimplayer6.com/20250724/AkL7hF5s/index.m3u8" },
      { name: "Tập 28", slug: "tap-28", source: "https://s6.kkphimplayer6.com/20250724/3ICX95VQ/index.m3u8" },
      { name: "Tập 29", slug: "tap-29", source: "https://s6.kkphimplayer6.com/20250725/CXha9GQW/index.m3u8" },
      { name: "Tập 30", slug: "tap-30", source: "https://s6.kkphimplayer6.com/20250725/EZVpFkQn/index.m3u8" },
      { name: "Tập 31", slug: "tap-31", source: "https://s6.kkphimplayer6.com/20250726/zwuLSDQq/index.m3u8" },
      { name: "Tập 32", slug: "tap-32", source: "https://s6.kkphimplayer6.com/20250726/ooM59FMf/index.m3u8" },
      { name: "Tập 33", slug: "tap-33", source: "https://s6.kkphimplayer6.com/20250727/UOB0J0LB/index.m3u8" },
      { name: "Tập 34", slug: "tap-34", source: "https://s6.kkphimplayer6.com/20250727/eVFwj0p8/index.m3u8" },
      { name: "Tập 35", slug: "tap-35", source: "https://s6.kkphimplayer6.com/20250727/amAyuDIY/index.m3u8" },
      { name: "Tập 36", slug: "tap-36", source: "https://s6.kkphimplayer6.com/20250727/zGOu4ND0/index.m3u8" },
      { name: "Tập 37", slug: "tap-37", source: "https://s6.kkphimplayer6.com/20250727/HqT5RNZE/index.m3u8" },
      { name: "Tập 38", slug: "tap-38", source: "https://s6.kkphimplayer6.com/20250727/8DStkmeo/index.m3u8" }
    ]
  },
  {
    id: "pm-31",
    slug: "tham-tu-lung-danh-conan-28-du-anh-cua-doc-nhan",
    crawlSlug: "tham-tu-lung-danh-conan-28-du-anh-cua-doc-nhan",
    title: "Thám Tử Lừng Danh Conan 28: Dư Ảnh Của Độc Nhãn",
    originTitle: "Detective Conan: One-Eyed Flashback",
    poster: "https://phimimg.com/upload/vod/20250827-1/aabb76a70d8afd21ddf2be37381c7587.jpg",
    backdrop: "https://phimimg.com/upload/vod/20250827-1/eddefbf4813488f89a6f0c766f69f82f.jpg",
    type: "single",
    sectionTags: ["anime", "phim-le", "hot"],
    quality: "1080",
    language: "Vietsub + Lồng Tiếng",
    duration: "109 phút",
    episodeCurrent: "Full",
    episodeTotal: "1",
    year: 2025,
    rating: 9.2,
    matchScore: 96,
    country: "Nhật Bản",
    countrySlug: "nhat-ban",
    genres: ["Anime", "Bí Ẩn", "Hình Sự", "Hành Động"],
    director: "Katsuya Shigehara",
    cast: ["Minami Takayama", "Wakana Yamazaki", "Rikiya Koyama"],
    ambientColors: ["#2563eb", "#dc2626", "#f59e0b"],
    trailerUrl: "",
    link: "https://phimmoiz.one/tham-tu-lung-danh-conan-28-du-anh-cua-doc-nhan/",
    synopsis: "Tại vùng núi tuyết Nagano lạnh giá, thanh tra độc nhãn Kansuke Yamato đối mặt với ký ức bị chôn vùi trong vụ lở tuyết năm xưa cùng sự trợ giúp phá án của Conan và Kogoro Mori.",
    episodes: [
      { name: "Full", slug: "full", source: "https://v7.kkphimplayer7.com/20260803/1Wvdz3zK/index.m3u8" }
    ]
  },
  {
    id: "pm-32",
    slug: "gia-dinh-la-so-1-phan-2",
    crawlSlug: "gia-dinh-la-so-1-phan-2",
    title: "Gia Đình Là Số 1 (Phần 2)",
    originTitle: "High Kick Through The Roof (Season 2)",
    poster: "https://phimimg.com/upload/vod/20240829-1/c925028c9c3d0e90c44c90891989e369.jpg",
    backdrop: "https://phimimg.com/upload/vod/20240829-1/e82c52723a69fe65ec3ba8cb43a932e8.jpg",
    type: "series",
    sectionTags: ["de-cu", "han-quoc", "phim-bo"],
    quality: "1080",
    language: "Lồng Tiếng",
    duration: "30 phút/tập",
    episodeCurrent: "Trọn Bộ 126 Tập",
    episodeTotal: "126",
    year: 2010,
    rating: 9.6,
    matchScore: 97,
    country: "Hàn Quốc",
    countrySlug: "han-quoc",
    genres: ["Hài Hước", "Gia Đình", "Tình Cảm"],
    director: "Kim Byung-wook",
    cast: ["Lee Soon-jae", "Hwang Jung-eum", "Choi Daniel", "Yoon Shi-yoon", "Shin Se-kyung"],
    ambientColors: ["#f59e0b", "#ec4899", "#10b981"],
    trailerUrl: "",
    link: "https://phimmoiz.one/gia-dinh-la-so-1-phan-2/",
    synopsis: "Tượng đài sitcom huyền thoại Hàn Quốc với bản lồng tiếng Việt kinh điển xoay quanh đại gia đình ông Lee Soon-jae và cô bé Heri đanh đá.",
    episodes: [
      { name: "Tập 001", slug: "tap-001", source: "https://s3.phim1280.tv/20240829/IBlZKlxy/index.m3u8" },
      { name: "Tập 002", slug: "tap-002", source: "https://s3.phim1280.tv/20240829/ZMXuGhPv/index.m3u8" },
      { name: "Tập 003", slug: "tap-003", source: "https://s3.phim1280.tv/20240829/SGgjmE86/index.m3u8" },
      { name: "Tập 004", slug: "tap-004", source: "https://s3.phim1280.tv/20240829/sODWYfF5/index.m3u8" },
      { name: "Tập 005", slug: "tap-005", source: "https://s3.phim1280.tv/20240829/brawD78r/index.m3u8" },
      { name: "Tập 006", slug: "tap-006", source: "https://s3.phim1280.tv/20240829/OSylHwPo/index.m3u8" },
      { name: "Tập 007", slug: "tap-007", source: "https://s3.phim1280.tv/20240829/ADo3LnBN/index.m3u8" },
      { name: "Tập 008", slug: "tap-008", source: "https://s3.phim1280.tv/20240829/WARUV59e/index.m3u8" },
      { name: "Tập 009", slug: "tap-009", source: "https://s3.phim1280.tv/20240829/vLYh6wG5/index.m3u8" },
      { name: "Tập 010", slug: "tap-010", source: "https://s3.phim1280.tv/20240829/URGcR3dF/index.m3u8" },
      { name: "Tập 011", slug: "tap-011", source: "https://s3.phim1280.tv/20240829/4F9aO4FY/index.m3u8" },
      { name: "Tập 012", slug: "tap-012", source: "https://s3.phim1280.tv/20240829/eRbwFbUQ/index.m3u8" },
      { name: "Tập 013", slug: "tap-013", source: "https://s3.phim1280.tv/20240829/eXTNMBso/index.m3u8" },
      { name: "Tập 014", slug: "tap-014", source: "https://s3.phim1280.tv/20240829/SIoLmMme/index.m3u8" },
      { name: "Tập 015", slug: "tap-015", source: "https://s3.phim1280.tv/20240829/YCbGCVPR/index.m3u8" },
      { name: "Tập 016", slug: "tap-016", source: "https://s3.phim1280.tv/20240829/xme0wvcl/index.m3u8" },
      { name: "Tập 017", slug: "tap-017", source: "https://s3.phim1280.tv/20240829/2QTtPVDS/index.m3u8" },
      { name: "Tập 018", slug: "tap-018", source: "https://s3.phim1280.tv/20240829/XCMo8Nn4/index.m3u8" },
      { name: "Tập 019", slug: "tap-019", source: "https://s3.phim1280.tv/20240829/zLArYkdg/index.m3u8" },
      { name: "Tập 020", slug: "tap-020", source: "https://s3.phim1280.tv/20240829/XLgDhLHQ/index.m3u8" },
      { name: "Tập 021", slug: "tap-021", source: "https://s3.phim1280.tv/20240829/AaVSmtVl/index.m3u8" },
      { name: "Tập 022", slug: "tap-022", source: "https://s3.phim1280.tv/20240829/tnd6w1eU/index.m3u8" },
      { name: "Tập 023", slug: "tap-023", source: "https://s3.phim1280.tv/20240829/THC3AhQM/index.m3u8" },
      { name: "Tập 024", slug: "tap-024", source: "https://s3.phim1280.tv/20240829/Omwhn1uI/index.m3u8" },
      { name: "Tập 025", slug: "tap-025", source: "https://s3.phim1280.tv/20240829/zspqDOLj/index.m3u8" },
      { name: "Tập 026", slug: "tap-026", source: "https://s3.phim1280.tv/20240829/WbLFFyCW/index.m3u8" },
      { name: "Tập 027", slug: "tap-027", source: "https://s3.phim1280.tv/20240829/vdh9Ezty/index.m3u8" },
      { name: "Tập 028", slug: "tap-028", source: "https://s3.phim1280.tv/20240829/KAbcoFEE/index.m3u8" },
      { name: "Tập 029", slug: "tap-029", source: "https://s3.phim1280.tv/20240829/csVsqD1U/index.m3u8" },
      { name: "Tập 030", slug: "tap-030", source: "https://s3.phim1280.tv/20240829/qd2O1AWV/index.m3u8" },
      { name: "Tập 031", slug: "tap-031", source: "https://s3.phim1280.tv/20240829/ifJWYsDJ/index.m3u8" },
      { name: "Tập 032", slug: "tap-032", source: "https://s3.phim1280.tv/20240829/sCKrOkY0/index.m3u8" },
      { name: "Tập 033", slug: "tap-033", source: "https://s3.phim1280.tv/20240829/1M2qFzLD/index.m3u8" },
      { name: "Tập 034", slug: "tap-034", source: "https://s3.phim1280.tv/20240829/jwgQwBIj/index.m3u8" },
      { name: "Tập 035", slug: "tap-035", source: "https://s3.phim1280.tv/20240829/bt8Ui7qm/index.m3u8" },
      { name: "Tập 036", slug: "tap-036", source: "https://s3.phim1280.tv/20240829/fypd6FNJ/index.m3u8" },
      { name: "Tập 037", slug: "tap-037", source: "https://s3.phim1280.tv/20240829/v5SGldXI/index.m3u8" },
      { name: "Tập 038", slug: "tap-038", source: "https://s3.phim1280.tv/20240829/26gM1Wbb/index.m3u8" },
      { name: "Tập 039", slug: "tap-039", source: "https://s3.phim1280.tv/20240829/amGyQpez/index.m3u8" },
      { name: "Tập 040", slug: "tap-040", source: "https://s3.phim1280.tv/20240829/Cl7m4pq8/index.m3u8" },
      { name: "Tập 041", slug: "tap-041", source: "https://s3.phim1280.tv/20240829/tLDPWTLL/index.m3u8" },
      { name: "Tập 042", slug: "tap-042", source: "https://s3.phim1280.tv/20240829/2aOOxxYB/index.m3u8" },
      { name: "Tập 043", slug: "tap-043", source: "https://s3.phim1280.tv/20240829/9l8jkfjt/index.m3u8" },
      { name: "Tập 044", slug: "tap-044", source: "https://s3.phim1280.tv/20240829/E6pBalUr/index.m3u8" },
      { name: "Tập 045", slug: "tap-045", source: "https://s3.phim1280.tv/20240829/8YEUZlPU/index.m3u8" },
      { name: "Tập 046", slug: "tap-046", source: "https://s3.phim1280.tv/20240829/vgerGOWj/index.m3u8" },
      { name: "Tập 047", slug: "tap-047", source: "https://s3.phim1280.tv/20240829/f8a514YI/index.m3u8" },
      { name: "Tập 048", slug: "tap-048", source: "https://s3.phim1280.tv/20240829/nlVMJIkd/index.m3u8" },
      { name: "Tập 049", slug: "tap-049", source: "https://s3.phim1280.tv/20240829/cixG5ixt/index.m3u8" },
      { name: "Tập 050", slug: "tap-050", source: "https://s3.phim1280.tv/20240829/yyBBsUTU/index.m3u8" },
      { name: "Tập 051", slug: "tap-051", source: "https://s3.phim1280.tv/20240829/AdglOicb/index.m3u8" },
      { name: "Tập 052", slug: "tap-052", source: "https://s3.phim1280.tv/20240829/1xvwYpKd/index.m3u8" },
      { name: "Tập 053", slug: "tap-053", source: "https://s3.phim1280.tv/20240829/ilzPnCQY/index.m3u8" },
      { name: "Tập 054", slug: "tap-054", source: "https://s3.phim1280.tv/20240829/YXhstVOe/index.m3u8" },
      { name: "Tập 055", slug: "tap-055", source: "https://s3.phim1280.tv/20240829/gBhJMIm1/index.m3u8" },
      { name: "Tập 056", slug: "tap-056", source: "https://s3.phim1280.tv/20240829/zzRCRwEW/index.m3u8" },
      { name: "Tập 057", slug: "tap-057", source: "https://s3.phim1280.tv/20240829/IbGVSXhI/index.m3u8" },
      { name: "Tập 058", slug: "tap-058", source: "https://s3.phim1280.tv/20240829/PUhs62XI/index.m3u8" },
      { name: "Tập 059", slug: "tap-059", source: "https://s3.phim1280.tv/20240829/zkv8G4va/index.m3u8" },
      { name: "Tập 060", slug: "tap-060", source: "https://s3.phim1280.tv/20240829/EXgrSz1R/index.m3u8" },
      { name: "Tập 061", slug: "tap-061", source: "https://s3.phim1280.tv/20240829/jaZJvfX9/index.m3u8" },
      { name: "Tập 062", slug: "tap-062", source: "https://s3.phim1280.tv/20240829/0sd4BrmW/index.m3u8" },
      { name: "Tập 063", slug: "tap-063", source: "https://s3.phim1280.tv/20240829/51Nyf3jl/index.m3u8" },
      { name: "Tập 064", slug: "tap-064", source: "https://s3.phim1280.tv/20240829/lN4BwwM7/index.m3u8" },
      { name: "Tập 065", slug: "tap-065", source: "https://s3.phim1280.tv/20240829/KxE5Ou5E/index.m3u8" },
      { name: "Tập 066", slug: "tap-066", source: "https://s3.phim1280.tv/20240829/Gpnv7NF6/index.m3u8" },
      { name: "Tập 067", slug: "tap-067", source: "https://s3.phim1280.tv/20240829/DjrwL5nt/index.m3u8" },
      { name: "Tập 068", slug: "tap-068", source: "https://s3.phim1280.tv/20240829/gPQeltfw/index.m3u8" },
      { name: "Tập 069", slug: "tap-069", source: "https://s3.phim1280.tv/20240829/qk05oJAF/index.m3u8" },
      { name: "Tập 070", slug: "tap-070", source: "https://s3.phim1280.tv/20240829/7dnVFh1l/index.m3u8" },
      { name: "Tập 071", slug: "tap-071", source: "https://s3.phim1280.tv/20240829/v7WzefL2/index.m3u8" },
      { name: "Tập 072", slug: "tap-072", source: "https://s3.phim1280.tv/20240829/B0oUjvXd/index.m3u8" },
      { name: "Tập 073", slug: "tap-073", source: "https://s3.phim1280.tv/20240829/tCcmUqcW/index.m3u8" },
      { name: "Tập 074", slug: "tap-074", source: "https://s3.phim1280.tv/20240829/NTlhQ49m/index.m3u8" },
      { name: "Tập 075", slug: "tap-075", source: "https://s3.phim1280.tv/20240829/QsK8sWXd/index.m3u8" },
      { name: "Tập 076", slug: "tap-076", source: "https://s3.phim1280.tv/20240829/70xIlP2f/index.m3u8" },
      { name: "Tập 077", slug: "tap-077", source: "https://s3.phim1280.tv/20240829/KbTAFR0O/index.m3u8" },
      { name: "Tập 078", slug: "tap-078", source: "https://s3.phim1280.tv/20240829/dsvzDADA/index.m3u8" },
      { name: "Tập 079", slug: "tap-079", source: "https://s3.phim1280.tv/20240829/ghEabius/index.m3u8" },
      { name: "Tập 080", slug: "tap-080", source: "https://s3.phim1280.tv/20240829/NonPEswh/index.m3u8" },
      { name: "Tập 081", slug: "tap-081", source: "https://s3.phim1280.tv/20240829/5I0AlUSx/index.m3u8" },
      { name: "Tập 082", slug: "tap-082", source: "https://s3.phim1280.tv/20240829/ssVSMSUr/index.m3u8" },
      { name: "Tập 083", slug: "tap-083", source: "https://s3.phim1280.tv/20240829/d0Xb79Qn/index.m3u8" },
      { name: "Tập 084", slug: "tap-084", source: "https://s3.phim1280.tv/20240829/Zu9F9GgY/index.m3u8" },
      { name: "Tập 085", slug: "tap-085", source: "https://s3.phim1280.tv/20240829/YjvTemXJ/index.m3u8" },
      { name: "Tập 086", slug: "tap-086", source: "https://s3.phim1280.tv/20240829/Lv6vAvvV/index.m3u8" },
      { name: "Tập 087", slug: "tap-087", source: "https://s3.phim1280.tv/20240829/UDHWNXQz/index.m3u8" },
      { name: "Tập 088", slug: "tap-088", source: "https://s3.phim1280.tv/20240829/ugffABJg/index.m3u8" },
      { name: "Tập 089", slug: "tap-089", source: "https://s3.phim1280.tv/20240829/SGOB4VKa/index.m3u8" },
      { name: "Tập 090", slug: "tap-090", source: "https://s3.phim1280.tv/20240829/gYtL8uOd/index.m3u8" },
      { name: "Tập 091", slug: "tap-091", source: "https://s3.phim1280.tv/20240829/6063OLMp/index.m3u8" },
      { name: "Tập 092", slug: "tap-092", source: "https://s3.phim1280.tv/20240829/5IKD6qLY/index.m3u8" },
      { name: "Tập 093", slug: "tap-093", source: "https://s3.phim1280.tv/20240829/PfQzoeQT/index.m3u8" },
      { name: "Tập 094", slug: "tap-094", source: "https://s3.phim1280.tv/20240829/TzIex0it/index.m3u8" },
      { name: "Tập 095", slug: "tap-095", source: "https://s3.phim1280.tv/20240829/YZNhO44R/index.m3u8" },
      { name: "Tập 096", slug: "tap-096", source: "https://s3.phim1280.tv/20240829/ZfdQ3DPC/index.m3u8" },
      { name: "Tập 097", slug: "tap-097", source: "https://s3.phim1280.tv/20240829/oDBtTkrJ/index.m3u8" },
      { name: "Tập 098", slug: "tap-098", source: "https://s3.phim1280.tv/20240829/oDyDfXfh/index.m3u8" },
      { name: "Tập 099", slug: "tap-099", source: "https://s3.phim1280.tv/20240829/0NhcpLdM/index.m3u8" },
      { name: "Tập 100", slug: "tap-100", source: "https://s3.phim1280.tv/20240829/7KiQWbzV/index.m3u8" },
      { name: "Tập 101", slug: "tap-101", source: "https://s3.phim1280.tv/20240829/zrnca47d/index.m3u8" },
      { name: "Tập 102", slug: "tap-102", source: "https://s3.phim1280.tv/20240829/Fva3LB9w/index.m3u8" },
      { name: "Tập 103", slug: "tap-103", source: "https://s3.phim1280.tv/20240829/2yGfbCqL/index.m3u8" },
      { name: "Tập 104", slug: "tap-104", source: "https://s3.phim1280.tv/20240829/MCLPjjS3/index.m3u8" },
      { name: "Tập 105", slug: "tap-105", source: "https://s3.phim1280.tv/20240829/HyzXOlCt/index.m3u8" },
      { name: "Tập 106", slug: "tap-106", source: "https://s3.phim1280.tv/20240829/VwJf0srN/index.m3u8" },
      { name: "Tập 107", slug: "tap-107", source: "https://s3.phim1280.tv/20240829/RPZVskvE/index.m3u8" },
      { name: "Tập 108", slug: "tap-108", source: "https://s3.phim1280.tv/20240829/fwdlfC4E/index.m3u8" },
      { name: "Tập 109", slug: "tap-109", source: "https://s3.phim1280.tv/20240829/lsKcTPOD/index.m3u8" },
      { name: "Tập 110", slug: "tap-110", source: "https://s3.phim1280.tv/20240829/3UyUL0vF/index.m3u8" },
      { name: "Tập 111", slug: "tap-111", source: "https://s3.phim1280.tv/20240829/DTzoc409/index.m3u8" },
      { name: "Tập 112", slug: "tap-112", source: "https://s3.phim1280.tv/20240829/bfPxGLqW/index.m3u8" },
      { name: "Tập 113", slug: "tap-113", source: "https://s3.phim1280.tv/20240829/iZIjhJAs/index.m3u8" },
      { name: "Tập 114", slug: "tap-114", source: "https://s3.phim1280.tv/20240829/s2tnpHTm/index.m3u8" },
      { name: "Tập 115", slug: "tap-115", source: "https://s3.phim1280.tv/20240829/kGnwaBkU/index.m3u8" },
      { name: "Tập 116", slug: "tap-116", source: "https://s3.phim1280.tv/20240829/09GBsdyV/index.m3u8" },
      { name: "Tập 117", slug: "tap-117", source: "https://s3.phim1280.tv/20240829/qn5Ig0wG/index.m3u8" },
      { name: "Tập 118", slug: "tap-118", source: "https://s3.phim1280.tv/20240829/AgjSUVoA/index.m3u8" },
      { name: "Tập 119", slug: "tap-119", source: "https://s3.phim1280.tv/20240829/NZzS2Bo8/index.m3u8" },
      { name: "Tập 120", slug: "tap-120", source: "https://s3.phim1280.tv/20240829/E3sdJyRe/index.m3u8" },
      { name: "Tập 121", slug: "tap-121", source: "https://s3.phim1280.tv/20240829/MlcQxO6W/index.m3u8" },
      { name: "Tập 122", slug: "tap-122", source: "https://s3.phim1280.tv/20240829/hgzf87Qp/index.m3u8" },
      { name: "Tập 123", slug: "tap-123", source: "https://s3.phim1280.tv/20240829/hSwGlDhL/index.m3u8" },
      { name: "Tập 124", slug: "tap-124", source: "https://s3.phim1280.tv/20240829/tdECzUQZ/index.m3u8" },
      { name: "Tập 125", slug: "tap-125", source: "https://s3.phim1280.tv/20240829/7iINnFEE/index.m3u8" },
      { name: "Tập 126", slug: "tap-126", source: "https://s3.phim1280.tv/20240829/71kx0aOY/index.m3u8" }
    ]
  }
];

/**
 * PHIMMOI LIVE DATA SERVICE
 * Kết nối trực tiếp tới https://phimmoiz.one/wp-json/wp/v2/posts?_embed
 * và https://phimapi.com/phim/<slug> (nguồn HLS thực tế của phimmoiz.one)
 */
class PhimmoiService {
  getKnownDirector(slug, title = "") {
    if (!slug && !title) return "";
    const s = String(slug || "").toLowerCase().trim();
    const t = String(title || "").toLowerCase().trim();

    if (s.includes("kinh-van-hoa") || t.includes("kính vạn hoa")) {
      if (s.includes("2024") || t.includes("bắt đền con dế ma")) {
        return "Võ Thanh Hòa";
      }
      return "Nguyễn Minh Chung, Đỗ Phú Hải";
    }
    if (s.includes("ban-linh-ky-hieu-lam") || t.includes("bản lĩnh kỷ hiểu lam") || s.includes("bronze-teeth")) {
      return "Trương Quốc Lập, Lưu Gia Thành";
    }
    if (s.includes("hoan-chau-cach-cach") || t.includes("hoàn châu cách cách") || s.includes("my-fair-princess")) {
      return "Tôn Thụ B培, Lý Bình";
    }
    if (s.includes("lupin") || t.includes("lupin") || s.includes("sieu-trom-lupin")) {
      if (s.includes("de-iii") || s.includes("the-first") || s.includes("conan")) return "Takashi Yamazaki";
      return "Louis Leterrier, Marcela Said";
    }
    if (s.includes("cau-be-mat-tich") || s.includes("stranger-things") || t.includes("stranger things")) {
      return "The Duffer Brothers";
    }
    if (s.includes("phi-vu-trieu-do") || s.includes("money-heist") || t.includes("phi vụ triệu đô")) {
      if (s.includes("berlin")) return "Albert Pintó, David Barrocal";
      if (s.includes("han-quoc") || s.includes("korea")) return "Kim Hong-sun";
      return "Álex Pina, Jesús Colmenar";
    }
    if (s.includes("tho-san-quai-vat") || s.includes("the-witcher") || t.includes("thợ săn quái vật")) {
      return "Lauren Schmidt Hissrich, Alik Sakharov";
    }
    if (s.includes("the-gioi-ma-quai") || s.includes("sweet-home") || t.includes("thế giới ma quái")) {
      return "Lee Eung-bok";
    }
    if (s.includes("the-gioi-khong-loi-thoat") || s.includes("alice-in-borderland") || t.includes("alice in borderland")) {
      return "Shinsuke Sato";
    }
    if (s.includes("naruto")) {
      if (s.includes("cai-chet-tien-doan") || s.includes("shippuden-the-movie-2007")) return "Hajime Kamegaki";
      if (s.includes("nhiem-vu-bi-mat") || s.includes("bonds")) return "Masahiko Murata";
      if (s.includes("nguoi-ke-thua-hoa-chi") || s.includes("will-of-fire")) return "Masahiko Murata";
      if (s.includes("toa-thap-bi-mat") || s.includes("lost-tower")) return "Masahiko Murata";
      if (s.includes("huyet-nguc") || s.includes("blood-prison")) return "Masahiko Murata";
      if (s.includes("duong-toi-ninja") || s.includes("road-to-ninja")) return "Hayato Date";
      if (s.includes("tran-chien-cuoi-cung") || s.includes("the-last")) return "Tsuneo Kobayashi";
      if (s.includes("boruto") || s.includes("nguoi-ke-nhiem")) return "Hiroyuki Yamashita";
      if (s.includes("cuoc-chien-o-tuyet-quoc") || s.includes("land-of-snow")) return "Tensai Okamura";
      if (s.includes("huyen-thoai-da-gelel") || s.includes("legend-of-the-stone-of-gelel")) return "Hirotsugu Kawasaki";
      if (s.includes("nhung-linh-gac-cua-nguyet-quoc") || s.includes("crescent-moon")) return "Toshiyuki Tsuru";
      return "Hayato Date";
    }
    if (s.includes("tro-choi-tri-menh") || s.includes("spirealm")) {
      return "Bành Bác Luân";
    }
    if (s === "mai" || t === "mai") return "Trấn Thành";
    if (s.includes("nha-ba-nu") || t.includes("nhà bà nữ")) return "Trấn Thành";
    if (s.includes("bo-gia") || t.includes("bố già")) return "Trấn Thành, Vũ Ngọc Đãng";
    if (s.includes("lat-mat-6") || t.includes("lật mặt 6")) return "Lý Hải";
    if (s.includes("lat-mat-7") || t.includes("lật mặt 7")) return "Lý Hải";
    if (s.includes("lat-mat") || t.includes("lật mặt")) return "Lý Hải";
    if (s.includes("dat-rung-phuong-nam") || t.includes("đất rừng phương nam")) return "Nguyễn Quang Dũng";
    if (s.includes("mat-biec") || t.includes("mắt biếc")) return "Victor Vũ";
    if (s.includes("toi-thay-hoa-vang") || t.includes("tôi thấy hoa vàng")) return "Victor Vũ";
    if (s.includes("nguoi-vo-cuoi-cung") || t.includes("người vợ cuối cùng")) return "Victor Vũ";
    if (s.includes("hai-phuong") || t.includes("hai phượng")) return "Lê Văn Kiệt";
    if (s.includes("em-chua-18") || t.includes("em chưa 18")) return "Lê Thanh Sơn";
    if (s.includes("tiec-trang-mau") || t.includes("tiệc trăng máu")) return "Nguyễn Quang Dũng";
    if (s.includes("mua-do") || t.includes("mưa đỏ")) return "Đặng Thái Huyền";
    if (s.includes("cam") || t.includes("cám")) return "Trần Hữu Tấn";
    if (s.includes("quy-cau") || t.includes("quỷ cẩu")) return "Lưu Thành Luân";
    if (s.includes("ma-da") || t.includes("ma da")) return "Nguyễn Hữu Hoàng";
    if (s.includes("cong-tu-bac-lieu") || t.includes("công tử bạc liêu")) return "Lý Minh Thắng";
    if (s.includes("gap-lai-chi-bau") || t.includes("gặp lại chị bầu")) return "Nhất Trung";
    if (s.includes("lam-giau-voi-ma") || t.includes("làm giàu với ma")) return "Trung Lùn";
    if (s.includes("sieu-lua-gap-sieu-lay") || t.includes("siêu lừa gặp siêu lầy")) return "Võ Thanh Hòa";
    if (s.includes("ngay-xua-co-mot-chuyen-tinh")) return "Trịnh Đình Lê Minh";
    if (s.includes("cu-roi-tu-than-2")) return "Peter Dukes";
    if (s.includes("tro-choi-con-muc") || s.includes("squid-game")) return "Hwang Dong-hyuk";
    if (s.includes("tai-xe-an-danh") || s.includes("taxi-driver")) return "Kang Dong-chul";
    if (s.includes("pha-dam-sinh-nhat-me")) return "Tạ Nguyên Bằng";
    if (s.includes("my-nhan-du")) return "Chu Dục Thần";
    if (s.includes("luat-su-cong-ich")) return "Lý Đình Khắc";
    if (s.includes("pham-nhan-tu-tien")) return "Dương Chấn Vũ";
    if (s.includes("ke-kien-tao") || s.includes("the-creator")) return "Gareth Edwards";
    if (s.includes("chappie")) return "Neill Blomkamp";
    if (s.includes("blade-runner-2049") || s.includes("toi-pham-nhan-ban-2049")) return "Denis Villeneuve";
    if (s.includes("blade-runner") || s.includes("toi-pham-nhan-ban")) return "Ridley Scott";
    if (s.includes("nguoi-may-troi-day") || s.includes("ex-machina")) return "Alex Garland";
    if (s.includes("until-dawn")) return "David F. Sandberg";
    if (s.includes("the-monkey")) return "Osgood Perkins";
    if (s.includes("drop")) return "Christopher Landon";
    if (s.includes("five-nights-at-freddy")) return "Emma Tammi";
    if (s.includes("hidden-tides")) return "Lưu Hạo Long";
    if (s.includes("painted-bone-woman")) return "Lý Trạch Lộ";
    if (s.includes("mysterious-case-in-river")) return "Trương Địch Tài";
    if (s.includes("last-shift")) return "Anthony DiBlasi";
    if (s.includes("premium-rush")) return "David Koepp";
    if (s.includes("alita-thien-than-chien-binh") || s.includes("alita")) return "Robert Rodriguez";
    if (s.includes("ai-tri-tue-nhan-tao")) return "Steven Spielberg";
    if (s.includes("canh-sat-nguoi-may-1987") || s.includes("robocop")) return "Paul Verhoeven";
    if (s.includes("tri-tue-sieu-viet") || s.includes("transcendence")) return "Wally Pfister";
    if (s.includes("finch")) return "Miguel Sapochnik";
    if (s.includes("nguoi-me-robot") || s.includes("i-am-mother")) return "Grant Sputore";

    return "";
  }

  cleanDirector(director, slug = "", title = "") {
    if (Array.isArray(director)) {
      director = director.filter(Boolean).join(", ");
    }
    let d = String(director || "").trim();
    const isFake =
      !d ||
      /^(?:film4k(?:\s*studio)?|phimapi|nguonc|ophim|kkphim|admin|studio|netflix|vietsub|thuyet minh|thuyết minh|long tieng|lồng tiếng|full|tap \d+|tập \d+|uploader|none|null|n\/a|unknown|dang cap nhat|đang cập nhật)$/i.test(d) ||
      /film4k|phimapi|nguonc|ophim|kkphim|\bstudio\b/i.test(d);
    if (isFake) {
      const known = this.getKnownDirector(slug, title);
      return known || "Đang cập nhật";
    }
    const known = this.getKnownDirector(slug, title);
    if (known && (d === "Đang cập nhật" || d === "N/A" || d.length < 3)) {
      return known;
    }
    return d;
  }

  constructor() {
    const streamPool = [
      "https://v7.kkphimplayer7.com/20260729/a8XUKTef/index.m3u8",
      "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8",
      "https://a.kvp726.com/20261011/cSOFRRA3/index.m3u8"
    ];

    this.movies = PHIMMOI_SEED_MOVIES.map((m) => {
      m.ambientColors = ["#ffffff", "#d4d4d4", "#a3a3a3"];
      if (!m.sectionTags.includes("vietsub")) m.sectionTags.push("vietsub");
      if (["pm-1", "pm-2", "pm-4", "pm-5", "pm-9", "pm-14", "pm-16", "pm-17", "pm-18", "pm-20", "pm-21", "pm-26"].includes(m.id)) {
        if (!m.sectionTags.includes("netflix")) m.sectionTags.push("netflix");
      }
      return m;
    });

    this.slugMap = new Map();
    this.canonicalKeyMap = new Map();
    this._smartCache = new Map();
    this.liveTrendingMovies = [];
    this.lastTrendingSyncAt = 0;
    this.movies.forEach((m) => {
      this.slugMap.set(m.slug, m);
      if (m.crawlSlug) this.slugMap.set(m.crawlSlug, m);
      if (Array.isArray(m.aliasSlugs)) {
        m.aliasSlugs.forEach((a) => this.slugMap.set(a, m));
      }
      const keys = this.getCanonicalMovieKeys(m);
      keys.forEach((k) => { if (k) this.canonicalKeyMap.set(k, m); });
    });

    // Đăng ký alias chuẩn cho các slug tương đương phổ biến (Godzilla, Ramayana, Lupin...)
    const KNOWN_SLUG_ALIASES = {
      "godzilla-tru-khong": "godzilla-tru-mot",
      "godzilla-minus-zero": "godzilla-tru-mot",
      "godzilla-minus-one": "godzilla-tru-mot",
      "hope-vung-tu-dia": "vung-tu-dia",
      "ke-tao-mua": "nguoi-tao-mua",
      "love-class-phan-3": "lop-hoc-tinh-yeu-phan-3",
      "sieu-trom-lupin-phan-4": "lupin-phan-4",
      "wednesday": "thu-tu-phan-1",
      "tham-tu-lung-danh-conan-1-qua-bom-choc-troi": "tham-tu-lung-danh-conan-qua-bom-choc-troi"
    };
    Object.entries(KNOWN_SLUG_ALIASES).forEach(([alias, target]) => {
      const targetMovie = this.slugMap.get(target);
      if (targetMovie) {
        this.slugMap.set(alias, targetMovie);
      }
    });

    // Khôi phục toàn bộ phim người dùng đã nạp trước đó từ localStorage (bền vững sau mỗi lần Reload/F5)
    this.loadPersistedIngestedMovies();

    // Tự động nạp toàn bộ kho phim đầy đủ từ js/movies-catalog.js nếu đã có sẵn
    if (Array.isArray(window.NGWYREN_FULL_CATALOG)) {
      this.loadFullCatalog(window.NGWYREN_FULL_CATALOG);
    }

    // Tối ưu hóa siêu tốc: Chỉ mục tìm kiếm cơ bản tức thì, phần chuẩn hóa không dấu nạp ngầm khi trình duyệt rảnh (idle)
    for (let i = 0; i < this.movies.length; i++) {
      const m = this.movies[i];
      m._titleLower = (m.title || "").toLowerCase();
      m._originLower = (m.originTitle || "").toLowerCase();
    }
    const warmSearchIndex = () => {
      let idx = 0;
      const total = this.movies.length;
      const step = () => {
        const limit = Math.min(idx + 600, total);
        for (; idx < limit; idx++) {
          const m = this.movies[idx];
          if (!m._titleNorm) m._titleNorm = this.normalizeSearchText(m.title);
          if (!m._originNorm) m._originNorm = this.normalizeSearchText(m.originTitle);
        }
        if (idx < total) {
          if (typeof window !== "undefined" && "requestIdleCallback" in window) {
            window.requestIdleCallback(step, { timeout: 1000 });
          } else {
            setTimeout(step, 40);
          }
        }
      };
      step();
    };
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(warmSearchIndex, { timeout: 1500 });
    } else {
      setTimeout(warmSearchIndex, 300);
    }

    this.isLiveConnected = true;
    this.lastSyncedCount = this.movies.length;
  }

  loadFullCatalog(catalog) {
    if (!Array.isArray(catalog) || this._fullCatalogLoaded) return;
    this._fullCatalogLoaded = true;

    const seedKeyCount = this.canonicalKeyMap.size;
    const len = catalog.length;
    for (let i = 0; i < len; i++) {
      const item = catalog[i];
      if (!item || !item.slug) continue;
      const rawQ = String(item.quality || item.maxRes || "").toUpperCase();
      const is4k = Boolean(
        item.hasReal4k === true ||
        rawQ === "4K" ||
        rawQ.includes("2160") ||
        Number(item.maxHeight) >= 2160
      );
      const baseTags = Array.isArray(item.sectionTags) ? item.sectionTags : ["hot", "vietsub"];
      if (is4k && !baseTags.includes("4k")) baseTags.push("4k");
      const epsArr = Array.isArray(item.episodes) ? item.episodes : [];
      const isActualSingle = epsArr.length <= 1 && (!epsArr[0]?.name || /full|bản\s*full/i.test(epsArr[0].name) || Number(item.episodeTotal) <= 1);
      const computedType = isActualSingle ? "single" : (item.type || "single");

      item.type = computedType;
      item.id = item.id || item.slug;
      item.crawlSlug = item.crawlSlug || item.slug;
      item.originTitle = item.originTitle || item.title;
      item.backdrop = item.backdrop || item.poster;
      item.quality = is4k ? "4K" : "1080";
      item.hasReal4k = is4k;
      item.has4k = is4k;
      item.language = item.language || "Vietsub";
      item.director = this.cleanDirector(item.director, item.slug, item.title || item.originTitle);
      item.country = item.country || "Quốc Tế";
      item.countrySlug = item.countrySlug || "quoc-te";
      item.matchScore = item.matchScore || 96;
      item.ambientColors = item.ambientColors || ["#ffffff", "#d4d4d4", "#a3a3a3"];
      item.genres = Array.isArray(item.genres) ? item.genres : [item.genres || "Chính Kịch"];
      item.cast = Array.isArray(item.cast) ? item.cast : [item.cast || "Dàn diễn viên chính"];
      item.sectionTags = baseTags;
      if (!Array.isArray(item.episodes) || item.episodes.length === 0) {
        item.episodes = [{ name: "Tập 1 (Vietsub)", slug: "tap-1", source: "", needsEnrich: true }];
      }

      for (let ei = 0; ei < item.episodes.length; ei++) {
        const ep = item.episodes[ei];
        if (!ep.slug) ep.slug = `tap-${ei + 1}`;
        if ((!ep.source && !ep.embed) || (ep.source && (ep.source.includes("opstream") || ep.source.includes("vip.opstream")))) {
          ep.needsEnrich = true;
        }
      }

      const keys = this.getCanonicalMovieKeys(item);
      const existingBySlug =
        this.slugMap.get(item.slug) ||
        (item.crawlSlug && this.slugMap.get(item.crawlSlug));
      let existing = existingBySlug;
      if (!existing) {
        for (let ki = 0; ki < keys.length; ki++) {
          const k = keys[ki];
          if (k && this.canonicalKeyMap.has(k)) {
            const candidateMatch = this.canonicalKeyMap.get(k);
            if (this.canMergeMovies(candidateMatch, item)) {
              existing = candidateMatch;
              break;
            }
          }
        }
      }

      if (existing && this.canMergeMovies(existing, item)) {
        this.mergeBestQualityMovie(existing, item);
        this.slugMap.set(item.slug, existing);
        if (item.crawlSlug) this.slugMap.set(item.crawlSlug, existing);
        if (Array.isArray(item.aliasSlugs)) {
          item.aliasSlugs.forEach((a) => this.slugMap.set(a, existing));
        }
        keys.forEach((k) => { if (k) this.canonicalKeyMap.set(k, existing); });
      } else {
        this.movies.push(item);
        this.slugMap.set(item.slug, item);
        if (item.crawlSlug) this.slugMap.set(item.crawlSlug, item);
        if (Array.isArray(item.aliasSlugs)) {
          item.aliasSlugs.forEach((a) => this.slugMap.set(a, item));
        }
        keys.forEach((k) => { if (k) this.canonicalKeyMap.set(k, item); });
      }
    }

    this.deduplicateCatalog();

    for (let i = 0; i < this.movies.length; i++) {
      const m = this.movies[i];
      m._titleLower = (m.title || "").toLowerCase();
      m._originLower = (m.originTitle || "").toLowerCase();
    }

    // Đăng ký alias chuẩn cho các slug tương đương sau khi nạp toàn bộ catalog
    const KNOWN_SLUG_ALIASES = {
      "godzilla-tru-khong": "godzilla-tru-mot",
      "godzilla-minus-zero": "godzilla-tru-mot",
      "godzilla-minus-one": "godzilla-tru-mot",
      "hope-vung-tu-dia": "vung-tu-dia",
      "ke-tao-mua": "nguoi-tao-mua",
      "love-class-phan-3": "lop-hoc-tinh-yeu-phan-3",
      "sieu-trom-lupin-phan-4": "lupin-phan-4",
      "wednesday": "thu-tu-phan-1",
      "tham-tu-lung-danh-conan-1-qua-bom-choc-troi": "tham-tu-lung-danh-conan-qua-bom-choc-troi"
    };
    Object.entries(KNOWN_SLUG_ALIASES).forEach(([alias, target]) => {
      const targetMovie = this.slugMap.get(target);
      if (targetMovie) {
        this.slugMap.set(alias, targetMovie);
      }
    });

    this.lastSyncedCount = this.movies.length;

    const warmSearchIndex = () => {
      let idx = 0;
      const total = this.movies.length;
      const step = () => {
        const limit = Math.min(idx + 600, total);
        for (; idx < limit; idx++) {
          const m = this.movies[idx];
          if (!m._titleNorm) m._titleNorm = this.normalizeSearchText(m.title);
          if (!m._originNorm) m._originNorm = this.normalizeSearchText(m.originTitle);
        }
        if (idx < total) {
          if (typeof window !== "undefined" && "requestIdleCallback" in window) {
            window.requestIdleCallback(step, { timeout: 1000 });
          } else {
            setTimeout(step, 40);
          }
        }
      };
      step();
    };
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(warmSearchIndex, { timeout: 1500 });
    } else {
      setTimeout(warmSearchIndex, 300);
    }

    if (typeof window !== "undefined" && window.app) {
      window.app.buildFastIndexes();
      window.app.setupHeroMovies();
      window.app.updateSidebarCounts();
      if (window.app.currentNav && window.app.currentNav !== "kham-pha") {
        window.app.renderMainView();
      } else if (window.app.currentNav === "kham-pha" && typeof window.app.updateExploreCountsAndGrid === "function") {
        window.app.updateExploreCountsAndGrid();
      }
    }
  }

  /**
   * Chuẩn hóa văn bản tìm kiếm: bỏ dấu tiếng Việt & ký tự đặc biệt (: - () ...) để gõ "star wars the clone war" hay "cuoc chien vo tinh" đều khớp tức thì
   */
  normalizeSearchText(str) {
    if (!str) return "";
    return String(str)
      .toLowerCase()
      .replace(/đ/g, "d")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Chuẩn hóa tựa phim cho đối soát trùng lặp: loại bỏ diacritics, liên từ, tiền tố, số mùa
   */
  normalizeTitleForMatch(str) {
    if (!str) return "";
    let t = String(str)
      .toLowerCase()
      .replace(/đ/g, "d")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    // Chuẩn hóa biến thể chuyển tự tiếng Nhật & tiếng Anh thông dụng (shippden, shippuden, shippuuden -> shippuden)
    t = t.replace(/shippu*den/g, "shippuden");
    t = t.replace(/\b(?:naruto\s+)?hurricane\s+chronicles\b/g, "");
    // Bỏ tiền tố thông dụng: phim, xem phim, the movie:
    t = t.replace(/^(?:phim|xem phim|the movie)\s*:?\s*/i, "");
    // Chuẩn hóa liên từ & / và -> and
    t = t.replace(/&/g, " and ").replace(/\s+va\s+/g, " and ");
    // Chuẩn hóa Star Wars & Mandalorian
    t = t.replace(/^star wars\s*:\s*/i, "star wars ");
    t = t.replace(/\bthe mandalorian\b/i, "mandalorian");
    // Chuẩn hóa season / phần / mùa
    t = t.replace(/\s*\((?!phan\s*\d|mua\s*\d|season\s*\d|part\s*\d|ban\s+|19\d\d|20\d\d)[^)]+\)/g, "");
    t = t.replace(/\(phan\s*\d+\)\s*\(([^)]+)\)/g, "$1");
    t = t.replace(/\b(?:phan|mua|season)\s*(\d+)\b/g, "s$1");
    t = t.replace(/\b(\d+)(?:st|nd|rd|th)\s*season\b/g, "s$1");
    t = t.replace(/\s+iii\b/g, " s3");
    t = t.replace(/\s+ii\b/g, " s2");
    t = t.replace(/\s+(\d+)$/g, " s$1");
    // Ký tự đặc biệt -> khoảng trắng
    t = t.replace(/[^a-z0-9]+/g, " ").trim();
    return t;
  }

  /**
   * Sinh danh sách tất cả các khóa nhận diện tương đương của một phim (tựa gốc, tựa dịch, slug, năm, ảnh asset)
   */
  getCanonicalMovieKeys(movie) {
    if (!movie) return [];
    const keys = new Set();
    if (movie.tmdbId) keys.add(`tmdb-${movie.tmdbId}`);
    if (movie.imdbId) keys.add(`imdb-${movie.imdbId}`);

    // 1. Nhận diện trùng lặp tuyệt đối theo filename ảnh đại diện/ảnh nền nếu có (CDN KKPhim, PhimAPI, Film4K)
    const imgFields = ["poster", "backdrop"];
    for (let ii = 0; ii < imgFields.length; ii++) {
      const url = movie[imgFields[ii]];
      if (url && typeof url === "string") {
        const clean = url.split("?")[0].split("#")[0];
        const fname = clean.split("/").pop().toLowerCase();
        if (fname.length > 6 && fname.includes(".") && !fname.startsWith("default") && !fname.startsWith("no-poster")) {
          keys.add(`img:${fname}`);
        }
      }
    }

    const year = movie.year ? String(movie.year).trim() : "";
    const titlesToTest = [
      movie.title,
      movie.originTitle,
      movie.crawlSlug ? movie.crawlSlug.replace(/-/g, " ") : "",
      movie.slug ? movie.slug.replace(/-/g, " ") : ""
    ];

    const genericFranchises = new Set([
      "naruto", "naruto shippuden", "conan", "tham tu lung danh conan",
      "one piece", "doraemon", "dragon ball", "dragon ball z",
      "dragon ball super", "pokemon", "shin cau be but chi", "crayon shin chan",
      "bleach", "fairy tail"
    ]);

    titlesToTest.forEach((raw) => {
      if (!raw) return;
      const norm = this.normalizeTitleForMatch(raw);
      if (!norm || norm.length < 3) return;

      let canonNorm = norm;
      if (norm.includes("godzilla tru mot") || norm.includes("godzilla tru khong") || norm.includes("godzilla minus one")) {
        canonNorm = "godzilla minus one";
      } else if (norm.includes("mandalorian") && (norm.includes("grogu") || norm.includes("and grogu"))) {
        canonNorm = "mandalorian and grogu";
      } else if (norm.includes("ramayana rise of a legend") || norm.includes("ramayana khoi nguon")) {
        canonNorm = "ramayana rise of a legend";
      }

      keys.add(canonNorm);
      if (year && year !== "0") {
        keys.add(`${canonNorm}::${year}`);
      }

      // 2. Khóa loại bỏ từ phụ 'movie', 'the movie', 'movie \d+'
      // Ví dụ: 'naruto shippuden movie 4 toa thap bi mat' -> 'naruto shippuden toa thap bi mat'
      const strippedMovie = canonNorm.replace(/\b(?:the\s+)?movie\s*\d*\b/g, "").replace(/\s+/g, " ").trim();
      if (strippedMovie && strippedMovie !== canonNorm && strippedMovie.length >= 3) {
        if (!genericFranchises.has(strippedMovie)) {
          keys.add(strippedMovie);
          if (year && year !== "0") keys.add(`${strippedMovie}::${year}`);
        }
      }

      // 3. Trích xuất phụ đề sau dấu hai chấm hoặc gạch ngang (Tòa Tháp Bị Mất, The Lost Tower, Người Kế Thừa Hỏa Chí...)
      const rawStr = String(raw);
      if (rawStr.includes(":") || rawStr.includes(" - ")) {
        const parts = rawStr.split(/[:\-]/);
        const subRaw = parts[parts.length - 1].trim();
        const normSub = this.normalizeTitleForMatch(subRaw);
        if (normSub && normSub.length >= 4 && normSub !== canonNorm) {
          if (year && year !== "0") {
            keys.add(`sub:${normSub}::${year}`);
          }
          const prefix = this.normalizeTitleForMatch(parts[0]);
          if (prefix && prefix.length >= 3) {
            keys.add(`${prefix}:${normSub}`);
            if (year && year !== "0") {
              keys.add(`${prefix}:${normSub}::${year}`);
            }
          }
        }
      }

      if (canonNorm.startsWith("star wars ")) {
        const withoutSw = canonNorm.replace(/^star wars\s+/, "").trim();
        if (withoutSw.length >= 3) {
          keys.add(withoutSw);
          if (year && year !== "0") keys.add(`${withoutSw}::${year}`);
        }
      }
    });

    return Array.from(keys);
  }

  /**
   * Chuẩn hóa khóa nhận diện phim chính (Primary Canonical Key)
   */
  getCanonicalMovieKey(movie) {
    if (!movie) return "";
    const keys = this.getCanonicalMovieKeys(movie);
    return keys[0] || (movie.slug || "");
  }

  /**
   * Tách lấy tên gốc của chuỗi series/franchise (loại bỏ các hậu tố Phần X, Season X, Movie X)
   */
  getSeriesRootKey(title, slug = "") {
    let t = (title || "").toLowerCase();
    t = t.replace(/đ/g, "d").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    t = t.replace(/[\(\[]?\s*(?:phần|phan|season|part|ss|mua|hoi|chuong)\s*\d+[\)\]]?/gi, "");
    t = t.replace(/[\(\[]?\s*(?:movie|tập|tap)\s*\d+[\)\]]?/gi, "");
    t = t.replace(/\s*[:\-]\s*(?:phần|phan|season|part|ss|mua)\s*\d+/gi, "");
    t = t.replace(/\s+\b(?:viii|vii|vi|iv|v|iii|ii|i)\b$/gi, "");
    t = t.replace(/\s+\d+$/g, "");
    const cleanStr = t.replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
    if (cleanStr.length >= 3) return cleanStr;
    if (slug) {
      let s = slug.toLowerCase().replace(/-(?:phan|season|part|ss|movie)-\d+/gi, "").replace(/-\d+$/g, "");
      return s.replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
    }
    return cleanStr;
  }

  /**
   * Kiểm tra xem luồng .m3u8 có phải link mẫu tạm thời (placeholder) hay không
   */
  isPlaceholderStream(src, movieSlug = "") {
    if (!src || typeof src !== "string") return true;
    const s = String(movieSlug || "").toLowerCase();
    if (src.includes("a8XUKTef") && !s.includes("vo-han-thanh")) return true;
    if (src.includes("XdpIV8L5") && !s.includes("matchbox")) return true;
    if (src.includes("cSOFRRA3") && !s.includes("dich-nhan-kiet")) return true;
    return false;
  }

  /**
   * Kiểm tra an toàn xem 2 bản ghi phim có thực sự là cùng 1 bộ phim/mùa phim hay không
   * Tuyệt đối ngăn chặn việc gộp nhầm 2 phim khác năm, khác định dạng (phim lẻ vs phim bộ), hoặc chỉ trùng tên tiếng Anh ngắn.
   */
  canMergeMovies(existing, candidate) {
    if (!existing || !candidate) return false;
    if (existing === candidate) return true;
    const s1 = (existing.slug || "").toLowerCase();
    const s2 = (candidate.slug || "").toLowerCase();
    const c1 = (existing.crawlSlug || s1).toLowerCase();
    const c2 = (candidate.crawlSlug || s2).toLowerCase();

    // 1. Trùng khớp slug hoặc crawlSlug trực tiếp
    if ((s1 && s1 === s2) || (c1 && c1 === c2) || (s1 && s1 === c2) || (c1 && c1 === s2)) {
      return true;
    }

    // 2. Không bao giờ gộp phim lẻ (1-2 tập) với phim bộ nhiều tập (> 2 tập) khi khác slug
    const eps1 = Array.isArray(existing.episodes) ? existing.episodes.length : 1;
    const eps2 = Array.isArray(candidate.episodes) ? candidate.episodes.length : 1;
    const isSingle1 = existing.type === "single" && eps1 <= 2;
    const isSingle2 = candidate.type === "single" && eps2 <= 2;
    const isMultiSeries1 = existing.type === "series" || eps1 > 2;
    const isMultiSeries2 = candidate.type === "series" || eps2 > 2;
    if ((isSingle1 && isMultiSeries2) || (isSingle2 && isMultiSeries1)) {
      return false;
    }

    // 3. Kiểm tra tag bản làm lại (Bản Nhật, Bản Hàn, Bản Anime, Live Action...)
    const remakeRe = /\b(ban\s+nhat|japan\s+version|ban\s+han|korea\s+version|ban\s+thai|ban\s+trung|ban\s+my|us\s+version|ban\s+anime|live\s+action)\b/i;
    const raw1 = `${existing.title || ""} ${existing.originTitle || ""} ${s1}`.replace(/đ/g, "d").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const raw2 = `${candidate.title || ""} ${candidate.originTitle || ""} ${s2}`.replace(/đ/g, "d").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const rm1 = (raw1.match(remakeRe) || [""])[0].toLowerCase();
    const rm2 = (raw2.match(remakeRe) || [""])[0].toLowerCase();
    if (rm1 !== rm2) return false;

    // 4. Khi khác slug: Bắt buộc tựa tiếng Việt chuẩn hóa phải khớp nhau (hoặc cùng tmdbId)
    if (existing.tmdbId && candidate.tmdbId && String(existing.tmdbId) === String(candidate.tmdbId)) {
      return true;
    }
    const vi1 = this.normalizeTitleForMatch(existing.title || "");
    const vi2 = this.normalizeTitleForMatch(candidate.title || "");
    if (vi1 && vi2 && vi1 !== vi2) {
      const stripped1 = vi1.replace(/\b(?:the\s+)?movie\s*\d*\b/g, "").replace(/\s+/g, " ").trim();
      const stripped2 = vi2.replace(/\b(?:the\s+)?movie\s*\d*\b/g, "").replace(/\s+/g, " ").trim();
      const isGodzillaM1 =
        (vi1.includes("godzilla tru") || vi1.includes("godzilla minus")) &&
        (vi2.includes("godzilla tru") || vi2.includes("godzilla minus"));
      // Hai nguồn đặt ngược tên: tựa Việt của bản này nằm ở ô "tên gốc" của bản kia
      // (vd: "Hàng Xóm Của Tôi Là Totoro" ↔ "Tonari No Totoro" / tên gốc "Hàng xóm của tôi là Totoro").
      // Chỉ chấp nhận khi cả hai là phim lẻ và trùng đúng năm.
      const stripYear = (t) => String(t || "").replace(/\s*[(\[]\s*(?:19|20)\d{2}\s*[)\]]\s*$/, "");
      const o1 = this.normalizeTitleForMatch(stripYear(existing.originTitle));
      const o2 = this.normalizeTitleForMatch(stripYear(candidate.originTitle));
      const yA = parseInt(existing.year, 10);
      const yB = parseInt(candidate.year, 10);
      const isSwappedTitle =
        isSingle1 && isSingle2 && yA > 1900 && yA === yB &&
        ((o1 && o1.length >= 8 && o1 === vi2) || (o2 && o2.length >= 8 && o2 === vi1));
      if (stripped1 !== stripped2 && !isGodzillaM1 && !isSwappedTitle) {
        return false;
      }
    }

    // 5. Khi khác slug: Kiểm tra năm phát hành (không gộp 2 bản phim cách nhau > 1 năm)
    const y1 = parseInt(existing.year, 10);
    const y2 = parseInt(candidate.year, 10);
    if (!isNaN(y1) && !isNaN(y2) && y1 > 1900 && y2 > 1900) {
      if (Math.abs(y1 - y2) > 1) {
        return false;
      }
    }

    return true;
  }

  /**
   * Hàm lọc trùng lặp tự sửa chữa toàn diện cho toàn bộ kho phim:
   * Giữ lại phiên bản chất lượng cao nhất (4K, nhiều tập, HLS chuẩn, ảnh nền đẹp) và loại bỏ hoàn toàn các bản sao.
   */
  deduplicateCatalog() {
    const seenSlugs = new Set();
    const seenKeys = new Set();
    const keyOwnerMap = new Map();
    const unique = [];

    for (let i = 0; i < this.movies.length; i++) {
      const m = this.movies[i];
      if (!m || !m.slug) continue;
      const keys = this.getCanonicalMovieKeys(m);
      const isSlugSeen = seenSlugs.has(m.slug) || (m.crawlSlug && seenSlugs.has(m.crawlSlug));
      let existing = isSlugSeen
        ? (this.slugMap.get(m.slug) || (m.crawlSlug && this.slugMap.get(m.crawlSlug)))
        : null;

      if (!existing) {
        for (let ki = 0; ki < keys.length; ki++) {
          const k = keys[ki];
          if (k && seenKeys.has(k)) {
            const owner = keyOwnerMap.get(k) || this.canonicalKeyMap.get(k);
            if (owner && this.canMergeMovies(owner, m)) {
              existing = owner;
              break;
            }
          }
        }
      }

      if (existing && existing !== m && this.canMergeMovies(existing, m)) {
        this.mergeBestQualityMovie(existing, m);
        this.slugMap.set(m.slug, existing);
        if (m.crawlSlug) this.slugMap.set(m.crawlSlug, existing);
        if (Array.isArray(m.aliasSlugs)) {
          m.aliasSlugs.forEach((a) => this.slugMap.set(a, existing));
        }
        keys.forEach((k) => {
          if (k) {
            this.canonicalKeyMap.set(k, existing);
            keyOwnerMap.set(k, existing);
          }
        });
        continue;
      }

      seenSlugs.add(m.slug);
      if (m.crawlSlug) seenSlugs.add(m.crawlSlug);
      if (Array.isArray(m.aliasSlugs)) {
        m.aliasSlugs.forEach((a) => seenSlugs.add(a));
      }
      keys.forEach((k) => {
        if (k) {
          seenKeys.add(k);
          keyOwnerMap.set(k, m);
        }
      });
      unique.push(m);
      this.slugMap.set(m.slug, m);
      if (m.crawlSlug) this.slugMap.set(m.crawlSlug, m);
      if (Array.isArray(m.aliasSlugs)) {
        m.aliasSlugs.forEach((a) => this.slugMap.set(a, m));
      }
      keys.forEach((k) => { if (k) this.canonicalKeyMap.set(k, m); });
    }

    this.movies = unique;
    this.lastSyncedCount = this.movies.length;
    return this.movies;
  }

  /**
   * Chấm điểm chất lượng của một bản phim (ưu tiên luồng .m3u8 thật, 4K/1080p, số tập đầy đủ, Thuyết Minh/Lồng Tiếng, ảnh 16:9)
   */
  scoreMovieQuality(m) {
    if (!m) return -999;
    let score = 0;
    const eps = Array.isArray(m.episodes) ? m.episodes : [];
    const validM3u8Eps = eps.filter(
      (e) =>
        e &&
        e.source &&
        (e.source.includes(".m3u8") || e.source.includes("/hls/")) &&
        !e.source.includes("opstream") &&
        !this.isPlaceholderStream(e.source, m.slug)
    );
    if (validM3u8Eps.length > 0) {
      score += 1000 + Math.min(600, validM3u8Eps.length * 12);
    } else {
      score -= 500;
    }
    if (m.quality === "4K" && Array.isArray(m.sectionTags) && m.sectionTags.includes("4k")) {
      score += 300;
    } else if (String(m.quality || "").includes("1080")) {
      score += 150;
    }
    const lang = (m.language || "").toLowerCase();
    if ((Array.isArray(m.dubEpisodes) && m.dubEpisodes.length > 0) || lang.includes("thuyết minh") || lang.includes("lồng tiếng")) {
      score += 120;
    }
    if (m.backdrop && m.backdrop !== m.poster && !m.backdrop.includes("phimmoiz.one")) {
      score += 80;
    }
    if (m.trailerUrl) score += 20;
    return score;
  }

  /**
   * Gộp 2 bản ghi trùng lặp của cùng 1 bộ phim, luôn giữ lại nguồn phát và siêu dữ liệu có chất lượng cao nhất
   */
  mergeBestQualityMovie(existing, candidate) {
    if (!existing || !candidate) return existing;
    if (!this.canMergeMovies(existing, candidate)) return existing;
    const existingValidEps = (existing.episodes || []).filter(
      (e) =>
        e &&
        e.source &&
        (e.source.includes(".m3u8") || e.source.includes("/hls/")) &&
        !e.source.includes("opstream") &&
        !this.isPlaceholderStream(e.source, existing.slug)
    );
    const candidateValidEps = (candidate.episodes || []).filter(
      (e) =>
        e &&
        e.source &&
        (e.source.includes(".m3u8") || e.source.includes("/hls/")) &&
        !e.source.includes("opstream") &&
        !this.isPlaceholderStream(e.source, candidate.slug)
    );

    if (
      candidateValidEps.length > existingValidEps.length ||
      (existingValidEps.length === 0 && (candidate.episodes?.length || 0) > (existing.episodes?.length || 0))
    ) {
      existing.episodes = candidate.episodes;
      if (candidate.episodeCurrent) existing.episodeCurrent = candidate.episodeCurrent;
      if (candidate.episodeTotal) existing.episodeTotal = candidate.episodeTotal;
    }
    if (candidate.dubEpisodes && candidate.dubEpisodes.length > (existing.dubEpisodes?.length || 0)) {
      existing.dubEpisodes = candidate.dubEpisodes;
    }
    if (candidate.nguoncEpisodes && candidate.nguoncEpisodes.length > (existing.nguoncEpisodes?.length || 0)) {
      existing.nguoncEpisodes = candidate.nguoncEpisodes;
    }
    if (candidate.film4kEpisodes && candidate.film4kEpisodes.length > (existing.film4kEpisodes?.length || 0)) {
      existing.film4kEpisodes = candidate.film4kEpisodes;
    }
    if (candidate.film4kSlug && !existing.film4kSlug) {
      existing.film4kSlug = candidate.film4kSlug;
    }
    if (candidate.overviewEn && !existing.overviewEn) {
      existing.overviewEn = candidate.overviewEn;
    }
    if (candidate.overviewVi && !existing.overviewVi) {
      existing.overviewVi = candidate.overviewVi;
    }
    if (candidate.hasReal4k === true || (candidate.quality === "4K" && candidate.hasReal4k !== false)) {
      existing.quality = "4K";
      existing.has4k = true;
      existing.hasReal4k = true;
      if (!Array.isArray(existing.sectionTags)) existing.sectionTags = ["hot", "vietsub"];
      if (!existing.sectionTags.includes("4k")) existing.sectionTags.push("4k");
    }
    if (candidate.language && candidate.language.length > (existing.language?.length || 0)) {
      existing.language = candidate.language;
    }
    if (candidate.poster && (!existing.poster || existing.poster.includes("phimmoiz.one"))) {
      existing.poster = candidate.poster;
    }
    if (candidate.backdrop && (!existing.backdrop || existing.backdrop.includes("phimmoiz.one") || existing.backdrop === existing.poster)) {
      existing.backdrop = candidate.backdrop;
    }
    if (!existing.trailerUrl && candidate.trailerUrl) {
      existing.trailerUrl = candidate.trailerUrl;
    }
    if (Array.isArray(candidate.sectionTags)) {
      candidate.sectionTags.forEach((tag) => {
        if (tag !== "4k" && !existing.sectionTags.includes(tag)) {
          existing.sectionTags.push(tag);
        }
      });
    }
    return existing;
  }

  /**
   * Bộ lọc loại bỏ hoàn toàn các phim quảng cáo, nhà cái cá cược hoặc spam từ API
   */
  isAdOrSpam(item) {
    if (!item) return false;
    const title = (item.title || item.name || "").toLowerCase();
    const slug = (item.slug || "").toLowerCase();
    const syn = (item.synopsis || item.description || item.content || "").toLowerCase();

    const adKeywords = [
      "i999", "i999.ai", "cwin", "quảng cáo", "quang cao", "nhà cái", "cá cược", "cá độ", "đặt cược",
      "tài xỉu", "bắn cá", "nổ hũ", "soi kèo", "kèo bóng", "casino", "sòng bài", "rút tiền 24/7",
      "baccarat", "fb88", "jun88", "shbet", "789bet", "hi88", "new88", "i9bet", "8xbet", "k8cc",
      "okvip", "kubet", "thabet", "w88", "m88", "188bet", "bk8", "dafabat", "fun88", "ae888", "sv388", "vn88",
      "sin88", "may88", "red88", "five88", "debet", "sv88", "zbet", "oxbet",
      "lixi88", "t.me/", "telegram", "zalo.me", "link cược", "hhpanda"
    ];

    for (const kw of adKeywords) {
      if (title.includes(kw) || slug.includes(kw)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Tự động làm sạch các câu quảng cáo của web nguồn trong phần mô tả phim
   */
  cleanAdText(text) {
    if (!text) return "";
    return text
      .replace(/bộ\s+phim\s+này\s+do\s*:?\s*i999(?:\.ai)?[^\n]*/gi, "")
      .replace(/i999(?:\.ai)?[^\n]*/gi, "")
      .replace(/bộ\s+phim\s+này\s+do[^\n]*/gi, "")
      .replace(/sản\s+phẩm\s*:\s*(?:nổ\s*hũ|game\s*bài|bắn\s*cá|sòng\s*bài|thể\s*thao|tài\s*xỉu)[^\n]*/gi, "")
      .replace(/rút\s+tiền\s+24\/7[^\n]*/gi, "")
      .replace(/nhận\s+tiền\s+trong\s+tích\s+tắc[^\n]*/gi, "")
      .replace(/tài\s+trợ\s+và\s+công\s+bố[^\n]*/gi, "")
      .replace(/cùng\s+(phimmoi|phimmoiz|nguonc|ophim|kkphim)[^.]*\./gi, "")
      .replace(/xem\s+phim\s+tại\s+[^\s,.]+/gi, "")
      .replace(/chúc\s+bạn\s+xem\s+phim\s+vui\s+vẻ[^.]*\./gi, "")
      .replace(/liên\s+hệ\s+quảng\s+cáo[^\n.]*/gi, "")
      .replace(/tham\s+gia\s+(cược|nhà\s+cái|casino|game\s*bài)[^\n.]*/gi, "")
      .replace(/(?:shbet|789bet|jun88|hi88|f8bet|new88|okvip|123b|mb66|i999|cwin|kubet|thabet|nohu)[^\n.]*/gi, "")
      .replace(/https?:\/\/[^\s]+/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  /**
   * Chuẩn hóa dữ liệu bài viết từ WordPress REST API
   */
  normalizeWpPost(post) {
    if (!post || !post.slug) return null;
    const postTitle = (post.title && post.title.rendered) || "";
    if (this.isAdOrSpam({ title: postTitle, slug: post.slug })) return null;
    const mb = post.meta_box || {};
    const embedded = post._embedded || {};

    // Lấy poster 2:3 từ wp:featuredmedia
    let posterUrl = "";
    if (embedded["wp:featuredmedia"] && embedded["wp:featuredmedia"][0]) {
      posterUrl = embedded["wp:featuredmedia"][0].source_url || "";
    }
    // Lấy backdrop 16:9 từ meta_box.poster
    const backdropUrl = (mb.poster && (mb.poster.full_url || mb.poster.url)) || posterUrl;
    if (!posterUrl && backdropUrl) posterUrl = backdropUrl;

    // Trích xuất thể loại, diễn viên, đạo diễn, quốc gia từ _embedded['wp:term']
    const terms = embedded["wp:term"] || [];
    const genres = [];
    const actors = [];
    let director = "Đang cập nhật";
    let country = "Quốc Tế";
    let countrySlug = "quoc-te";

    terms.flat().forEach((term) => {
      if (!term || !term.taxonomy) return;
      if (term.taxonomy === "category" && !["Phim Lẻ", "Phim Bộ"].includes(term.name)) {
        genres.push(term.name);
      } else if (term.taxonomy === "actor") {
        actors.push(term.name);
      } else if (term.taxonomy === "director") {
        director = term.name;
      } else if (term.taxonomy === "country") {
        country = term.name;
        countrySlug = term.slug;
      }
    });

    // Làm sạch mô tả HTML & loại bỏ quảng cáo nguồn
    const rawExcerpt = (post.excerpt && post.excerpt.rendered) || (post.content && post.content.rendered) || "";
    const cleanSynopsis = this.cleanAdText(this.stripHtml(rawExcerpt)).slice(0, 420);

    // Tập phim & nguồn phát HLS .m3u8
    const streamPool = [
      "https://v7.kkphimplayer7.com/20260729/a8XUKTef/index.m3u8",
      "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8",
      "https://a.kvp726.com/20261011/cSOFRRA3/index.m3u8"
    ];
    const rawEpisodes = Array.isArray(mb.episodes) ? mb.episodes : [];
    const uniqueEps = [];
    const seenEpNames = new Set();
    rawEpisodes.forEach((ep, idx) => {
      if (ep && ep.source) {
        const epName = ep.episode_name || `Tập ${idx + 1}`;
        if (!seenEpNames.has(epName)) {
          seenEpNames.add(epName);
          uniqueEps.push({
            name: epName.startsWith("Tập") || epName === "Full" ? epName : `Tập ${epName}`,
            slug: ep.episode_slug || `tap-${idx + 1}`,
            source: ep.source
          });
        }
      }
    });

    // Xác định crawlSlug từ meta_box.crawl_link
    let crawlSlug = post.slug;
    if (mb.crawl_link && mb.crawl_link.includes("/phim/")) {
      crawlSlug = mb.crawl_link.split("/phim/")[1].replace(/\/$/, "");
    }

    const isSeries = mb.type === "series" || (mb.so_tap && parseInt(mb.so_tap, 10) > 1) || uniqueEps.length > 1;
    const sectionTags = ["hot", "de-cu"];
    if (isSeries) sectionTags.push("phim-bo");
    else sectionTags.push("phim-le");
    if (countrySlug === "han-quoc") sectionTags.push("han-quoc");
    if (countrySlug === "trung-quoc") sectionTags.push("trung-quoc");
    if (countrySlug === "au-my") sectionTags.push("au-my");
    if (countrySlug === "viet-nam") sectionTags.push("viet-nam");
    if (genres.some((g) => g.toLowerCase().includes("hoạt hình") || g.toLowerCase().includes("anime"))) {
      sectionTags.push("anime");
    }

    return {
      id: `wp-${post.id}`,
      slug: post.slug,
      crawlSlug,
      title: this.decodeEntities((post.title && post.title.rendered) || "Phim Mới"),
      originTitle: mb.origin_name || post.slug,
      poster: posterUrl || "https://phimmoiz.one/wp-content/uploads/2026/10/matchbox-phim-dien-anh-poster.webp",
      backdrop: backdropUrl || posterUrl,
      type: isSeries ? "series" : "single",
      sectionTags,
      quality: "1080",
      language: mb.language || "Vietsub",
      duration: mb.time || (isSeries ? "45 phút/tập" : "115 phút"),
      episodeCurrent: isSeries ? `Tập ${uniqueEps.length || mb.so_tap || 1}` : "Full",
      episodeTotal: String(mb.so_tap || uniqueEps.length || 1),
      year: parseInt(mb.release_year, 10) || 2026,
      rating: (8.4 + ((post.id % 14) / 10)).toFixed(1),
      matchScore: 90 + (post.id % 9),
      country,
      countrySlug,
      genres: genres.length ? genres : ["Hành Động", "Chính Kịch"],
      director: this.cleanDirector(director, post.slug, post.title && post.title.rendered ? post.title.rendered : post.slug),
      cast: actors.length ? actors.slice(0, 8) : ["Dàn diễn viên chính"],
      ambientColors: ["#ffffff", "#d4d4d4", "#a3a3a3"],
      trailerUrl: mb.trailer_url || "",
      link: post.link || `https://phimmoiz.one/${post.slug}/`,
      synopsis: cleanSynopsis || "Phim điện ảnh và truyền hình chất lượng cao Full HD Vietsub trên Ngwyren Cinema.",
      episodes: uniqueEps.length
        ? uniqueEps
        : [{ name: "Tập 1 (Vietsub)", slug: "tap-1", source: "", embed: "", needsEnrich: true }]
    };
  }

  /**
   * Fetch thông minh hỗ trợ bộ nhớ đệm 0ms + kết nối trực tiếp siêu tốc (không treo qua proxy chết với API đã hỗ trợ CORS)
   */
  async smartFetchJson(url, timeoutMs = 3000, bypassCache = false) {
    if (!url || url.includes("phimmoiz.one")) return null;
    if (!bypassCache && this._smartCache && this._smartCache.has(url)) {
      return this._smartCache.get(url);
    }
    const isDirectCorsApi =
      url.includes("phimapi.com") ||
      url.includes("nguonc.com") ||
      url.includes("film4k.net/api/");
    const attempts = isDirectCorsApi
      ? [url]
      : [
          url,
          `${PHIMMOI_CONFIG.corsProxies[0]}${encodeURIComponent(url)}`
        ];

    for (const targetUrl of attempts) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(targetUrl, { signal: controller.signal });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          if (this._smartCache) this._smartCache.set(url, data);
          return data;
        }
        // Nếu API trực tiếp trả về 404/400 thì dừng ngay, không thử lại qua proxy gây trễ
        if (isDirectCorsApi) return null;
      } catch (err) {
        clearTimeout(timer);
      }
    }
    return null;
  }

  /**
   * Fetch văn bản (M3U8 / WebVTT Subtitles) có hỗ trợ tự động vượt CORS cho luồng phụ đề & playlist Film4k
   */
  async smartFetchText(url, timeoutMs = 4500) {
    if (!url) return "";
    if (!this._textCache) this._textCache = new Map();
    if (this._textCache.has(url)) return this._textCache.get(url);

    // 1. Thử kết nối trực tiếp trước
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), Math.min(timeoutMs, 2600));
      const directRes = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (directRes.ok) {
        const txt = await directRes.text();
        if (txt) {
          if (this._textCache.size > 80) this._textCache.clear();
          this._textCache.set(url, txt);
          return txt;
        }
      }
    } catch (_) {}

    // 2. Fallback qua AllOrigins JSON wrapper (Hỗ trợ CORS * ổn định cho .m3u8 và .vtt trên film4k.net)
    try {
      const ctrl2 = new AbortController();
      const t2 = setTimeout(() => ctrl2.abort(), timeoutMs);
      const wrapUrl = `${PHIMMOI_CONFIG.allOriginsGet || "https://api.allorigins.win/get?url="}${encodeURIComponent(url)}`;
      const wrapRes = await fetch(wrapUrl, { signal: ctrl2.signal });
      clearTimeout(t2);
      if (wrapRes.ok) {
        const payload = await wrapRes.json();
        const contents = payload?.contents || "";
        if (typeof contents === "string" && contents.length > 0) {
          if (this._textCache.size > 80) this._textCache.clear();
          this._textCache.set(url, contents);
          return contents;
        }
      }
    } catch (_) {}

    // 3. Fallback qua corsproxy.io
    try {
      const ctrl3 = new AbortController();
      const t3 = setTimeout(() => ctrl3.abort(), timeoutMs);
      const cpUrl = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
      const cpRes = await fetch(cpUrl, { signal: ctrl3.signal });
      clearTimeout(t3);
      if (cpRes.ok) {
        const txt = await cpRes.text();
        if (txt && txt.includes("#EXTM3U")) {
          if (this._textCache.size > 80) this._textCache.clear();
          this._textCache.set(url, txt);
          return txt;
        }
      }
    } catch (_) {}

    return "";
  }

  /**
   * Chuẩn hóa dữ liệu phim từ Film4K API (https://film4k.net/api/...)
   * Hỗ trợ định dạng 4K Ultra HD thực tế (2160p), phụ đề Vietsub/Song ngữ và ảnh TMDb sắc nét
   */
  normalizeFilm4kItem(fItem) {
    if (!fItem || !fItem.slug) return null;
    const titleVi = (fItem.title && (fItem.title.vi || fItem.title.en)) || fItem.name || "";
    const titleEn = (fItem.title && (fItem.title.en || fItem.title.vi)) || fItem.origin_name || titleVi;
    if (!titleVi || this.isAdOrSpam({ title: titleVi, slug: fItem.slug })) return null;

    const maxResStr = String(fItem.maxRes || fItem.quality || "").toUpperCase();
    const is4k = Boolean(
      fItem.hasReal4k === true ||
      maxResStr === "4K" ||
      maxResStr.includes("2160") ||
      Number(fItem.maxHeight) >= 2160
    );
    const isSer = fItem.mediaType === "tv" || fItem.mediaType === "series" || Boolean(fItem.totalSeasons);
    const posterUrl =
      (typeof fItem.poster === "object" && fItem.poster !== null
        ? fItem.poster.vi || fItem.poster.en
        : fItem.poster) ||
      fItem.backdrop ||
      "";
    const backdropUrl = fItem.backdrop || posterUrl;
    const countryName =
      (typeof fItem.country === "object" && fItem.country !== null
        ? fItem.country.vi || fItem.country.en
        : fItem.country) || "Âu Mỹ";
    const countrySlug = fItem.countrySlug || "au-my";
    const rawGenres =
      (fItem.genres && (Array.isArray(fItem.genres.vi) ? fItem.genres.vi : Array.isArray(fItem.genres.en) ? fItem.genres.en : fItem.genres)) || [];
    const genres = Array.isArray(rawGenres) && rawGenres.length > 0
      ? rawGenres.map((g) => String(g).replace(/^Phim\s+/i, "").trim()).filter(Boolean)
      : ["Hành Động", "Điện Ảnh"];

    const tags = ["hot", "de-cu", "vietsub", "film4k", isSer ? "phim-bo" : "phim-le"];
    if (is4k) tags.push("4k");
    if (countrySlug === "han-quoc" || countrySlug === "au-my") tags.push("netflix");
    if (genres.some((g) => /hoạt hình|anime/i.test(g))) tags.push("anime");

    const overviewVi = (fItem.overview && fItem.overview.vi) || "";
    const overviewEn = (fItem.overview && fItem.overview.en) || "";
    // Chỉ kích hoạt Thuyết Minh nếu có track âm thanh tiếng Việt thực tế, không dựa vào cờ viDub mặc định của Film4K
    const hasDub = Boolean(fItem.hasRealDub || fItem.viDubActual === true || (Array.isArray(fItem.audio) && fItem.audio.some((a) => a.lang === "vie")));
    const langLabel = hasDub ? "Vietsub + Thuyết Minh" : "Vietsub";
    const hlsDirect = fItem.hlsUrl
      ? fItem.hlsUrl.startsWith("http")
        ? fItem.hlsUrl
        : `${PHIMMOI_CONFIG.film4kBase}${fItem.hlsUrl}`
      : "";

    const scoreNum = Number(fItem.score || 0);
    const ratingVal = scoreNum >= 5 ? Number(scoreNum.toFixed(1)) : 9.1;

    return {
      id: `f4k-${fItem._id || fItem.slug}`,
      slug: fItem.slug,
      crawlSlug: fItem.slug,
      film4kSlug: fItem.slug,
      title: titleVi,
      originTitle: titleEn,
      poster: posterUrl,
      backdrop: backdropUrl,
      type: isSer ? "series" : "single",
      sectionTags: tags,
      quality: is4k ? "4K" : "1080",
      has4k: is4k,
      language: langLabel,
      duration: isSer ? "45 phút/tập" : (is4k ? "4K Ultra HD" : "120 phút"),
      episodeCurrent: isSer ? "Full Vietsub" : (is4k ? "Full 4K" : "Full"),
      episodeTotal: isSer ? "Trọn Bộ" : "1",
      year: Number(fItem.year) || 2025,
      rating: ratingVal,
      matchScore: is4k ? 99 : 97,
      country: countryName,
      countrySlug,
      genres,
      director: this.cleanDirector(fItem.director, fItem.slug, titleVi),
      cast: ["Dàn diễn viên chính"],
      ambientColors: ["#ffffff", "#d4d4d4", "#a3a3a3"],
      trailerUrl: "",
      overviewVi,
      overviewEn,
      synopsis: overviewVi || overviewEn || `${titleVi} (${titleEn}) chuẩn ${is4k ? "4K Ultra HD" : "Full HD 1080p"} ${langLabel} trên Ngwyren Cinema.`,
      episodes: [
        {
          name: isSer ? "Tập 1" : (is4k ? "Full 4K" : "Full"),
          slug: isSer ? "tap-1" : "full",
          source: hlsDirect,
          isFilm4k: Boolean(hlsDirect),
          is4k,
          needsEnrich: !hlsDirect || isSer
        }
      ]
    };
  }

  /**
   * Đồng bộ xu hướng phim thời gian thực (Real-time Trending) từ PhimAPI v3, NguonC & Film4K (4K/Vietsub)
   */
  async syncLatestFromPhimmoi(perPage = 24) {
    const [phimApiV3Page1, nguoncLatestPage1, film4kHome] = await Promise.all([
      this.smartFetchJson(`${PHIMMOI_CONFIG.phimApiLatest}?page=1`, 2800, true).catch(() => null),
      this.smartFetchJson(`${PHIMMOI_CONFIG.nguoncApiLatest}?page=1`, 2800, true).catch(() => null),
      this.smartFetchJson(`${PHIMMOI_CONFIG.film4kApiHome}`, 3200, true).catch(() => null)
    ]);
    const wpPage1 = null;

    let addedCount = 0;
    let updatedCount = 0;
    const newlyAdded = [];
    const liveTrendingBatch = [];
    const seenTrendingSlugs = new Set();

    const registerTrendingMovie = (movieObj, rankIdx, updatedAtMs) => {
      if (!movieObj || !movieObj.slug) return;
      movieObj.isLiveTrending = true;
      movieObj.liveTrendRank = Math.min(movieObj.liveTrendRank || 999, rankIdx);
      movieObj.updatedAtMs = Math.max(movieObj.updatedAtMs || 0, updatedAtMs || Date.now());
      if (!seenTrendingSlugs.has(movieObj.slug)) {
        seenTrendingSlugs.add(movieObj.slug);
        liveTrendingBatch.push(movieObj);
      }
    };

    const upsertLiveCandidate = (candidate, rankIdx, updatedAtMs) => {
      if (!candidate || !candidate.slug || this.isAdOrSpam(candidate)) return;
      const epStr = String(candidate.episodeCurrent || "").toLowerCase();
      if (epStr.includes("trailer") || epStr.includes("sắp chiếu")) return;

      const keys = this.getCanonicalMovieKeys(candidate);
      let existing =
        this.slugMap.get(candidate.slug) ||
        (candidate.crawlSlug && this.slugMap.get(candidate.crawlSlug));
      if (!existing) {
        for (let ki = 0; ki < keys.length; ki++) {
          const k = keys[ki];
          if (k && this.canonicalKeyMap.has(k)) {
            const owner = this.canonicalKeyMap.get(k);
            if (this.canMergeMovies(owner, candidate)) {
              existing = owner;
              break;
            }
          }
        }
      }

      if (existing && this.canMergeMovies(existing, candidate)) {
        const prevEpCur = existing.episodeCurrent;
        this.mergeBestQualityMovie(existing, candidate);
        if (candidate.episodeCurrent && candidate.episodeCurrent !== prevEpCur) {
          existing.episodeCurrent = candidate.episodeCurrent;
          existing._isEnriched = false;
          if (Array.isArray(existing.episodes) && existing.episodes[0] && !existing.episodes[0].source) {
            existing.episodes[0].needsEnrich = true;
          }
          updatedCount++;
        }
        if (candidate.backdrop && (!existing.backdrop || existing.backdrop === existing.poster)) {
          existing.backdrop = candidate.backdrop;
          delete existing._cachedBackdrop;
        }
        this.slugMap.set(candidate.slug, existing);
        if (candidate.crawlSlug) this.slugMap.set(candidate.crawlSlug, existing);
        keys.forEach((k) => { if (k) this.canonicalKeyMap.set(k, existing); });
        registerTrendingMovie(existing, rankIdx, updatedAtMs);
      } else {
        candidate._titleLower = (candidate.title || "").toLowerCase();
        candidate._originLower = (candidate.originTitle || "").toLowerCase();
        newlyAdded.push(candidate);
        this.slugMap.set(candidate.slug, candidate);
        if (candidate.crawlSlug) this.slugMap.set(candidate.crawlSlug, candidate);
        keys.forEach((k) => { if (k) this.canonicalKeyMap.set(k, candidate); });
        addedCount++;
        registerTrendingMovie(candidate, rankIdx, updatedAtMs);
      }
    };

    // 1. Nguồn PhimAPI v3 (Cập nhật từng phút với ảnh thumb 16:9 widescreen & điểm IMDb/TMDB)
    const paItems = phimApiV3Page1?.items || phimApiV3Page1?.data?.items || [];
    if (Array.isArray(paItems)) {
      paItems.forEach((item, idx) => {
        if (!item || !item.slug || this.isAdOrSpam(item)) return;
        const posterUrl = item.poster_url?.startsWith("http")
          ? item.poster_url
          : item.poster_url
          ? `https://phimimg.com/${item.poster_url.replace(/^\//, "")}`
          : "";
        const thumbUrl = item.thumb_url?.startsWith("http")
          ? item.thumb_url
          : item.thumb_url
          ? `https://phimimg.com/${item.thumb_url.replace(/^\//, "")}`
          : "";
        const isSer =
          item.type === "series" ||
          item.type === "hoathinh" ||
          item.type === "tvshows" ||
          (item.episode_current && /tập\s*\d+/i.test(item.episode_current));
        const genres = Array.isArray(item.category) && item.category.length > 0
          ? item.category.map((c) => c.name).filter(Boolean)
          : ["Chính Kịch"];
        const countryName = item.country?.[0]?.name || "Quốc Tế";
        const countrySlug = item.country?.[0]?.slug || "quoc-te";
        const tags = ["hot", "de-cu", "vietsub", isSer ? "phim-bo" : "phim-le"];
        if (
          item.type === "hoathinh" ||
          genres.some((g) => g.toLowerCase().includes("hoạt hình") || g.toLowerCase().includes("anime"))
        ) {
          tags.push("anime");
        }
        if (countrySlug === "han-quoc" || countrySlug === "au-my") {
          tags.push("netflix");
        }
        const imdbVote = Number(item.imdb?.vote_average || item.tmdb?.vote_average || 0);
        const ratingVal = imdbVote >= 6.5 ? Number(imdbVote.toFixed(1)) : 9.1;
        const updatedAtMs = Date.parse(item.modified?.time || "") || Date.now();

        const candidate = {
          id: item.slug,
          slug: item.slug,
          crawlSlug: item.slug,
          title: item.name || item.origin_name,
          originTitle: item.origin_name || item.name,
          poster: posterUrl || thumbUrl,
          backdrop: thumbUrl || posterUrl,
          type: isSer ? "series" : "single",
          sectionTags: tags,
          quality: "1080",
          language: item.lang || "Vietsub",
          duration: item.time || (isSer ? "45 phút/tập" : "115 phút"),
          episodeCurrent: item.episode_current || (isSer ? "Tập Mới" : "Full"),
          episodeTotal: isSer ? "Đang cập nhật" : "1",
          year: Number(item.year) || 2026,
          rating: ratingVal,
          matchScore: 97,
          country: countryName,
          countrySlug,
          genres,
          director: "Đang cập nhật",
          cast: ["Dàn diễn viên chính"],
          ambientColors: ["#ffffff", "#d4d4d4", "#a3a3a3"],
          trailerUrl: "",
          synopsis: `${item.name} (${item.origin_name || item.year || 2026}) — Xu hướng mới cập nhật bản Full HD ${item.lang || "Vietsub"} trên Ngwyren Cinema.`,
          episodes: [{ name: item.episode_current || "Tập 1", slug: "tap-1", source: "", needsEnrich: true }]
        };
        upsertLiveCandidate(candidate, idx + 1, updatedAtMs);
      });
    }

    // 2. Nguồn NguonC Real-time Latest
    const ncItems = nguoncLatestPage1?.items || [];
    if (Array.isArray(ncItems)) {
      ncItems.forEach((nc, idx) => {
        if (!nc || !nc.slug || this.isAdOrSpam(nc)) return;
        const isSer = parseInt(nc.total_episodes, 10) > 1 || /tập\s*\d+/i.test(nc.current_episode || "");
        const posterUrl = nc.thumb_url_webp || nc.thumb_url || nc.poster_url_webp || nc.poster_url || "";
        const backdropUrl = nc.poster_url_webp || nc.poster_url || nc.thumb_url_webp || nc.thumb_url || "";
        const updatedAtMs = Date.parse(nc.modified || "") || Date.now();
        const candidate = {
          id: nc.slug,
          slug: nc.slug,
          crawlSlug: nc.slug,
          title: nc.name,
          originTitle: nc.original_name || nc.name,
          poster: posterUrl,
          backdrop: backdropUrl,
          type: isSer ? "series" : "single",
          sectionTags: ["hot", "de-cu", "vietsub", isSer ? "phim-bo" : "phim-le"],
          quality: "1080",
          language: nc.language || "Vietsub",
          duration: nc.time || (isSer ? "45 phút/tập" : "115 phút"),
          episodeCurrent: nc.current_episode || (isSer ? "Tập Mới" : "Full"),
          episodeTotal: String(nc.total_episodes || 1),
          year: parseInt(nc.year, 10) || 2026,
          rating: 9.0,
          matchScore: 96,
          country: "Quốc Tế",
          countrySlug: "quoc-te",
          genres: ["Chính Kịch", "Thịnh Hành"],
          director: this.cleanDirector(nc.director, nc.slug, nc.name),
          cast: nc.casts ? nc.casts.split(/,\s*/).slice(0, 6) : ["Dàn diễn viên chính"],
          ambientColors: ["#ffffff", "#d4d4d4", "#a3a3a3"],
          trailerUrl: "",
          synopsis: this.cleanAdText(nc.description || "").slice(0, 220) || `${nc.name} chất lượng cao Vietsub.`,
          episodes: [{ name: nc.current_episode || "Tập 1", slug: "tap-1", source: "", needsEnrich: true }]
        };
        upsertLiveCandidate(candidate, idx + 5, updatedAtMs);
      });
    }

    // 3. Nguồn Film4K (4K Ultra HD & Vietsub / Song Ngữ)
    if (film4kHome && typeof film4kHome === "object") {
      const f4kPool = [
        ...(Array.isArray(film4kHome.top) ? film4kHome.top : []),
        ...(Array.isArray(film4kHome.newMovies) ? film4kHome.newMovies : []),
        ...(Array.isArray(film4kHome.newSeries) ? film4kHome.newSeries : []),
        ...(Array.isArray(film4kHome.list) ? film4kHome.list : [])
      ];
      const seenF4k = new Set();
      f4kPool.forEach((fItem, idx) => {
        if (!fItem || !fItem.slug || seenF4k.has(fItem.slug)) return;
        seenF4k.add(fItem.slug);
        const normalizedF4k = this.normalizeFilm4kItem(fItem);
        if (normalizedF4k) {
          const updatedAtMs = Number(fItem.updatedAt) || Date.now();
          upsertLiveCandidate(normalizedF4k, idx + 3, updatedAtMs);
        }
      });
    }

    // 4. Nguồn WP API bổ sung
    if (Array.isArray(wpPage1)) {
      wpPage1.forEach((post, idx) => {
        const normalized = this.normalizeWpPost(post);
        if (normalized) {
          upsertLiveCandidate(normalized, idx + 15, Date.now() - idx * 60000);
        }
      });
    }

    if (newlyAdded.length > 0) {
      const userIngested = this.movies.filter((m) => m && m._userIngested);
      const restMovies = this.movies.filter((m) => !m || !m._userIngested);
      this.movies = [...userIngested, ...newlyAdded, ...restMovies];
      this.deduplicateCatalog();
    }

    if (liveTrendingBatch.length > 0) {
      this.liveTrendingMovies = liveTrendingBatch;
      this.lastTrendingSyncAt = Date.now();
    }

    this.isLiveConnected = liveTrendingBatch.length > 0 || this.isLiveConnected;
    this.lastSyncedCount = liveTrendingBatch.length;
    return {
      added: addedCount,
      updated: updatedCount,
      trendingCount: this.liveTrendingMovies.length,
      total: this.movies.length,
      live: liveTrendingBatch.length > 0
    };
  }

  /**
   * Thuật toán xếp hạng Xu Hướng Thời Gian Thực (Real-time Trend Score) cho cột Đề Xuất
   * Kết hợp: Luồng API vừa cập nhật (PhimAPI v3 / NguonC) + Lịch chiếu hôm nay + Năm hiện hành + Độ nét ảnh nền 16:9
   */
  getRealtimeTrendingList(contextMovies = null, limit = 6, rotationSeed = 0, watchHistory = []) {
    const now = new Date();
    const jsDay = now.getDay();
    const todayKey = jsDay === 0 ? "chu-nhat" : `thu-${jsDay + 1}`;
    const todaySchedule = (window.NGWYREN_AIR_SCHEDULE && window.NGWYREN_AIR_SCHEDULE[todayKey]) || [];
    const airingTodaySlugs = new Set(todaySchedule.map((item) => item.slug).filter(Boolean));

    // Tập thể loại người dùng vừa xem gần đây để tăng nhẹ điểm cá nhân hóa theo thời gian thực
    const recentGenres = new Set();
    const recentWatchedSlugs = new Set();
    if (Array.isArray(watchHistory)) {
      watchHistory.slice(0, 5).forEach((h) => {
        if (!h || !h.slug) return;
        recentWatchedSlugs.add(h.slug);
        const mov = this.slugMap.get(h.slug);
        if (mov && Array.isArray(mov.genres)) {
          mov.genres.forEach((g) => recentGenres.add(g));
        }
      });
    }

    const isGlobalContext = !contextMovies || contextMovies === this.movies || contextMovies.length >= this.movies.length - 5;
    let candidatePool = [];

    if (isGlobalContext) {
      const seen = new Set();
      const addCandidate = (m) => {
        if (m && m.slug && !seen.has(m.slug)) {
          seen.add(m.slug);
          candidatePool.push(m);
        }
      };
      // 1. Ưu tiên hàng đầu: Phim vừa cập nhật trực tiếp từ API thời gian thực
      (this.liveTrendingMovies || []).forEach(addCandidate);
      // 2. Phim có lịch phát sóng đúng ngày hôm nay
      todaySchedule.forEach((s) => {
        const m = this.slugMap.get(s.slug);
        if (m) addCandidate(m);
      });
      // 3. Top phim bom tấn mới nhất trong kho
      this.movies.slice(0, 90).forEach(addCandidate);
    } else {
      candidatePool = contextMovies.slice(0, 120);
    }

    const nowMs = Date.now();
    const scored = [];

    for (let i = 0; i < candidatePool.length; i++) {
      const m = candidatePool[i];
      if (!m || !m.slug) continue;

      let score = 0;

      // 1. Điểm xu hướng trực tiếp từ Live API (vừa ra tập mới / vừa lên sóng)
      if (m.isLiveTrending) {
        const rankBonus = Math.max(20, 260 - (m.liveTrendRank || 20) * 8);
        score += rankBonus;
        if (m.updatedAtMs) {
          const hoursAgo = Math.max(0, (nowMs - m.updatedAtMs) / (1000 * 3600));
          if (hoursAgo <= 6) score += 120;
          else if (hoursAgo <= 24) score += 85;
          else if (hoursAgo <= 72) score += 45;
        }
      }

      // 2. Điểm phát sóng đúng ngày hôm nay (Lịch chiếu thời gian thực)
      if (airingTodaySlugs.has(m.slug)) {
        score += 135;
      }

      // 3. Điểm độ mới theo năm phát hành (2026 / 2025)
      const yr = Number(m.year) || 2024;
      if (yr >= 2026) score += 95;
      else if (yr === 2025) score += 60;
      else if (yr === 2024) score += 25;

      // 4. Ưu tiên ảnh nền ngang 16:9 sắc nét (không dùng ảnh dọc bị cắt hoặc nguồn ảnh chết)
      const b = m.backdrop || "";
      if (b && b !== m.poster && !b.includes("phimmoiz.one") && !b.includes("-poster.")) {
        score += 65;
      }

      // 5. Điểm đánh giá & nhãn Hot / Đề cử
      score += (Number(m.rating) || 8.5) * 6;
      if (Array.isArray(m.sectionTags)) {
        if (m.sectionTags.includes("de-cu")) score += 30;
        if (m.sectionTags.includes("hot")) score += 20;
      }

      // 6. Cá nhân hóa nhẹ theo gu đang xem của người dùng
      if (recentGenres.size > 0 && Array.isArray(m.genres)) {
        let matchedG = 0;
        for (const g of m.genres) {
          if (recentGenres.has(g)) matchedG++;
        }
        score += Math.min(36, matchedG * 14);
      }

      // Giữ vị trí tự nhiên cho các siêu phẩm đầu bảng
      score += Math.max(0, 36 - i * 0.4);

      scored.push({ movie: m, score });
    }

    scored.sort((a, b) => b.score - a.score);

    // Lấy nhóm dẫn đầu xu hướng (Top 18) và xoay vòng thông minh theo khung thời gian thực + rotationSeed
    const topWindow = scored.slice(0, Math.min(18, scored.length)).map((x) => x.movie);
    if (topWindow.length <= limit) return topWindow;

    // Khung thời gian thực (mỗi 2 phút hoặc khi người dùng bấm làm mới)
    const timeSlot = Math.floor(nowMs / (2 * 60 * 1000)) + (Number(rotationSeed) || 0);
    const result = [];
    const used = new Set();

    // Luôn giữ 2 vị trí dẫn đầu từ nhóm Top 4 Hot nhất thời điểm hiện tại
    const top4 = topWindow.slice(0, Math.min(4, topWindow.length));
    for (let k = 0; k < Math.min(2, top4.length); k++) {
      const pick = top4[(timeSlot + k) % top4.length];
      if (pick && !used.has(pick.slug)) {
        used.add(pick.slug);
        result.push(pick);
      }
    }

    // Các vị trí còn lại lấy luân phiên từ nhóm Top 18 xu hướng thời gian thực
    const restPool = topWindow.filter((m) => !used.has(m.slug));
    if (restPool.length > 0) {
      const startOffset = (timeSlot * 2) % restPool.length;
      for (let j = 0; j < restPool.length && result.length < limit; j++) {
        const candidate = restPool[(startOffset + j) % restPool.length];
        if (candidate && !used.has(candidate.slug)) {
          used.add(candidate.slug);
          result.push(candidate);
        }
      }
    }

    return result.slice(0, limit);
  }

  /**
   * Tìm kiếm tức thì trong kho dữ liệu cục bộ đã nạp (0ms phản hồi ngay cho UI)
   */
  searchLocalOnly(query) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return this.movies;
    const qNorm = this.normalizeSearchText ? this.normalizeSearchText(q) : q;
    const qTokens = qNorm ? qNorm.split(" ").filter(Boolean) : [];

    const localMatches = this.movies.filter((m) => {
      if (!m) return false;
      const t = (m.title || "").toLowerCase();
      const o = (m.originTitle || "").toLowerCase();
      const tNorm = m._titleNorm || (m._titleNorm = this.normalizeSearchText(m.title));
      const oNorm = m._originNorm || (m._originNorm = this.normalizeSearchText(m.originTitle));
      const combinedNorm = `${tNorm} ${oNorm}`;
      return (
        t.includes(q) ||
        o.includes(q) ||
        (qNorm && (tNorm.includes(qNorm) || oNorm.includes(qNorm))) ||
        (qTokens.length > 1 && qTokens.every((tk) => combinedNorm.includes(tk))) ||
        (Array.isArray(m.genres) && m.genres.some((g) => (g || "").toLowerCase().includes(q))) ||
        (m.country && String(m.country).toLowerCase().includes(q)) ||
        (Array.isArray(m.cast) && m.cast.some((c) => (c || "").toLowerCase().includes(q))) ||
        (m.director && String(m.director).toLowerCase().includes(q))
      );
    });

    const scored = localMatches.map((m) => {
      const t = (m.title || "").toLowerCase();
      const o = (m.originTitle || "").toLowerCase();
      const tNorm = m._titleNorm || (m._titleNorm = this.normalizeSearchText(m.title));
      const oNorm = m._originNorm || (m._originNorm = this.normalizeSearchText(m.originTitle));
      let score = 0;
      if (t === q || o === q || (qNorm && (tNorm === qNorm || oNorm === qNorm))) score = 250;
      else if (t.startsWith(q) || (qNorm && tNorm.startsWith(qNorm))) score = 180;
      else if (o.startsWith(q) || (qNorm && oNorm.startsWith(qNorm))) score = 150;
      else if (t.includes(q) || (qNorm && tNorm.includes(qNorm))) score = 110;
      else if (o.includes(q) || (qNorm && oNorm.includes(qNorm))) score = 90;
      else if (qTokens.length > 1 && qTokens.every((tk) => `${tNorm} ${oNorm}`.includes(tk))) score = 80;
      else score = 30;
      return { movie: m, score };
    });
    scored.sort((a, b) => b.score - a.score || (b.movie.year || 0) - (a.movie.year || 0));

    const dedupedResults = [];
    const seenSearchSlugs = new Set();
    const seenSearchKeys = new Set();
    const keyToMovieMap = new Map();
    for (let si = 0; si < scored.length; si++) {
      const movie = scored[si].movie;
      if (!movie || !movie.slug) continue;
      const keys = this.getCanonicalMovieKeys(movie);
      const isSlugSeen = seenSearchSlugs.has(movie.slug) || (movie.crawlSlug && seenSearchSlugs.has(movie.crawlSlug));
      const matchedKey = keys.find((k) => k && seenSearchKeys.has(k) && this.canMergeMovies(keyToMovieMap.get(k), movie));
      if (isSlugSeen || matchedKey) {
        const existing = (matchedKey && keyToMovieMap.get(matchedKey)) || this.slugMap.get(movie.slug);
        if (existing && existing !== movie && this.canMergeMovies(existing, movie)) {
          this.mergeBestQualityMovie(existing, movie);
        }
        continue;
      }
      seenSearchSlugs.add(movie.slug);
      if (movie.crawlSlug) seenSearchSlugs.add(movie.crawlSlug);
      keys.forEach((k) => {
        if (k) {
          seenSearchKeys.add(k);
          keyToMovieMap.set(k, movie);
        }
      });
      dedupedResults.push(movie);
    }
    return dedupedResults;
  }

  /**
   * Tìm kiếm phim đa nguồn: Kho 1470+ phim + Netflix/PhimAPI Vietsub + NguonC Vietsub + WP API
   */
  async searchMovies(query) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return this.movies;
    const cacheKey = `search:${q}`;
    if (this._smartCache && this._smartCache.has(cacheKey)) {
      const cached = this._smartCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 120000 && Array.isArray(cached.results)) {
        return cached.results;
      }
    }
    const qNorm = this.normalizeSearchText(q);
    const qTokens = qNorm ? qNorm.split(" ").filter(Boolean) : [];

    // 1. Tìm tức thì trong kho dữ liệu đã nạp (hỗ trợ cả có dấu, không dấu, và bỏ qua dấu hai chấm / gạch ngang)
    const localMatches = this.movies.filter((m) => {
      if (!m) return false;
      const t = (m.title || "").toLowerCase();
      const o = (m.originTitle || "").toLowerCase();
      const tNorm = m._titleNorm || (m._titleNorm = this.normalizeSearchText(m.title));
      const oNorm = m._originNorm || (m._originNorm = this.normalizeSearchText(m.originTitle));
      const combinedNorm = `${tNorm} ${oNorm}`;
      return (
        t.includes(q) ||
        o.includes(q) ||
        (qNorm && (tNorm.includes(qNorm) || oNorm.includes(qNorm))) ||
        (qTokens.length > 1 && qTokens.every((tk) => combinedNorm.includes(tk))) ||
        (Array.isArray(m.genres) && m.genres.some((g) => (g || "").toLowerCase().includes(q))) ||
        (m.country && String(m.country).toLowerCase().includes(q)) ||
        (Array.isArray(m.cast) && m.cast.some((c) => (c || "").toLowerCase().includes(q))) ||
        (m.director && String(m.director).toLowerCase().includes(q))
      );
    });

    // 2. Gọi song song API Vietsub, Film4K & Netflix trực tuyến (Ưu tiên PhimAPI + Film4K phản hồi siêu tốc ~200ms)
    const encodedQ = encodeURIComponent(query.trim());
    const [phimApiRes, nguoncRes, film4kSugRes] = await Promise.all([
      this.smartFetchJson(`${PHIMMOI_CONFIG.phimApiSearch}?keyword=${encodedQ}&limit=12`, 2500).catch(() => null),
      this.smartFetchJson(`${PHIMMOI_CONFIG.nguoncApiSearch}?keyword=${encodedQ}`, 2000).catch(() => null),
      this.smartFetchJson(`${PHIMMOI_CONFIG.film4kApiSuggest}${encodedQ}`, 2200).catch(() => null)
    ]);
    const remotePosts = [];

    // Nguồn 1: PhimAPI (Netflix & KKPhim Vietsub)
    if (phimApiRes && phimApiRes.data && Array.isArray(phimApiRes.data.items)) {
      // Phân tích series trong tập kết quả để ngăn chặn nhà cung cấp gán trùng ảnh thumbnail cho các phần
      const seriesGroup = new Map();
      const addToGroup = (k, it) => {
        if (!k) return;
        if (!seriesGroup.has(k)) seriesGroup.set(k, []);
        const arr = seriesGroup.get(k);
        if (!arr.includes(it)) arr.push(it);
      };
      phimApiRes.data.items.forEach((it) => {
        if (!it) return;
        const rootVi = this.getSeriesRootKey(it.name, it.slug);
        const rootEn = this.getSeriesRootKey(it.origin_name, it.slug);
        addToGroup(rootVi, it);
        addToGroup(rootEn, it);
      });

      phimApiRes.data.items.forEach((item) => {
        if (!item || !item.slug || this.slugMap.has(item.slug) || this.isAdOrSpam(item)) return;
        const posterUrl = item.poster_url?.startsWith("http") ? item.poster_url : `https://phimimg.com/${item.poster_url}`;
        let thumbUrl = item.thumb_url?.startsWith("http") ? item.thumb_url : `https://phimimg.com/${item.thumb_url}`;

        // Nếu trong cùng series có nhiều phần/mùa: Đảm bảo mỗi phần là 1 bức ảnh riêng biệt
        const rootVi = this.getSeriesRootKey(item.name, item.slug);
        const rootEn = this.getSeriesRootKey(item.origin_name, item.slug);
        const siblings = (rootVi && seriesGroup.get(rootVi)) || (rootEn && seriesGroup.get(rootEn));
        if (siblings && siblings.length > 1) {
          const distinctPosters = new Set(siblings.map((s) => s.poster_url).filter(Boolean));
          if (distinctPosters.size > 1 && posterUrl) {
            thumbUrl = posterUrl;
          }
        }
        const isSer = item.type === "series" || (item.episode_current && item.episode_current.includes("/"));
        const newMovie = {
          id: `pa-${item._id || item.slug}`,
          slug: item.slug,
          crawlSlug: item.slug,
          title: item.name || item.origin_name,
          originTitle: item.origin_name || item.name,
          poster: posterUrl,
          backdrop: thumbUrl || posterUrl,
          type: isSer ? "series" : "single",
          sectionTags: ["netflix", "vietsub", "hot", isSer ? "phim-bo" : "phim-le"],
          quality: "1080",
          language: item.lang || "Vietsub",
          duration: item.time || "1080",
          episodeCurrent: item.episode_current || "Full Vietsub",
          episodeTotal: "Full",
          year: item.year || 2025,
          rating: 9.2,
          matchScore: 96,
          country: item.country?.[0]?.name || "Quốc Tế",
          countrySlug: item.country?.[0]?.slug || "au-my",
          genres: item.category ? item.category.map((c) => c.name) : ["Chính Kịch"],
          director: this.cleanDirector(item.director, item.slug, item.name || item.origin_name),
          cast: ["Dàn diễn viên chính"],
          ambientColors: ["#ffffff", "#d4d4d4", "#a3a3a3"],
          trailerUrl: "",
          link: "",
          synopsis: `${item.name} (${item.origin_name}) bản Full HD 1080p ${item.lang || "Vietsub"} trên Ngwyren Cinema.`,
          episodes: [{ name: "Tập 1 (Vietsub)", slug: "tap-1", source: "", embed: "", needsEnrich: true }]
        };
        const keys = this.getCanonicalMovieKeys(newMovie);
        let existingDup = null;
        for (let ki = 0; ki < keys.length; ki++) {
          const k = keys[ki];
          if (k && this.canonicalKeyMap.has(k)) {
            const owner = this.canonicalKeyMap.get(k);
            if (this.canMergeMovies(owner, newMovie)) {
              existingDup = owner;
              break;
            }
          }
        }
        if (existingDup && this.canMergeMovies(existingDup, newMovie)) {
          this.mergeBestQualityMovie(existingDup, newMovie);
          this.slugMap.set(newMovie.slug, existingDup);
          keys.forEach((k) => { if (k) this.canonicalKeyMap.set(k, existingDup); });
          if (!localMatches.includes(existingDup)) localMatches.push(existingDup);
          return;
        }
        this.movies.unshift(newMovie);
        this.slugMap.set(newMovie.slug, newMovie);
        keys.forEach((k) => { if (k) this.canonicalKeyMap.set(k, newMovie); });
        localMatches.push(newMovie);
      });
    }

    // Nguồn 2: NguonC Vietsub CDN
    if (nguoncRes && Array.isArray(nguoncRes.items)) {
      const ncSeriesGroup = new Map();
      const addToNcGroup = (k, it) => {
        if (!k) return;
        if (!ncSeriesGroup.has(k)) ncSeriesGroup.set(k, []);
        const arr = ncSeriesGroup.get(k);
        if (!arr.includes(it)) arr.push(it);
      };
      nguoncRes.items.forEach((it) => {
        if (!it) return;
        const rootVi = this.getSeriesRootKey(it.name, it.slug);
        const rootEn = this.getSeriesRootKey(it.original_name, it.slug);
        addToNcGroup(rootVi, it);
        addToNcGroup(rootEn, it);
      });

      nguoncRes.items.forEach((nc) => {
        if (!nc || !nc.slug || this.slugMap.has(nc.slug) || this.isAdOrSpam(nc)) return;
        const isSer = parseInt(nc.total_episodes, 10) > 1;
        let posterUrl = nc.thumb_url || nc.poster_url;
        let backdropUrl = nc.poster_url || nc.thumb_url;

        const rootVi = this.getSeriesRootKey(nc.name, nc.slug);
        const rootEn = this.getSeriesRootKey(nc.original_name, nc.slug);
        const siblings = (rootVi && ncSeriesGroup.get(rootVi)) || (rootEn && ncSeriesGroup.get(rootEn));
        if (siblings && siblings.length > 1) {
          const distinctPosters = new Set(siblings.map((s) => s.thumb_url).filter(Boolean));
          if (distinctPosters.size > 1 && nc.thumb_url) {
            backdropUrl = nc.thumb_url;
            posterUrl = nc.thumb_url;
          }
        }

        const newMovie = {
          id: `nc-${nc.slug}`,
          slug: nc.slug,
          crawlSlug: nc.slug,
          title: nc.name,
          originTitle: nc.original_name || nc.name,
          poster: posterUrl,
          backdrop: backdropUrl,
          type: isSer ? "series" : "single",
          sectionTags: ["vietsub", "hot", isSer ? "phim-bo" : "phim-le"],
          quality: "1080",
          language: nc.language || "Vietsub",
          duration: nc.time || "1080",
          episodeCurrent: nc.current_episode || "Full Vietsub",
          episodeTotal: String(nc.total_episodes || 1),
          year: parseInt(nc.year, 10) || 2025,
          rating: 9.0,
          matchScore: 94,
          country: "Quốc Tế",
          countrySlug: "quoc-te",
          genres: ["Chính Kịch", "Hành Động"],
          director: this.cleanDirector(nc.director, nc.slug, nc.name),
          cast: nc.casts ? nc.casts.split(/,\s*/) : ["Dàn diễn viên chính"],
          ambientColors: ["#ffffff", "#d4d4d4", "#a3a3a3"],
          trailerUrl: "",
          link: "",
          synopsis: this.cleanAdText(nc.description) || `${nc.name} chất lượng cao Vietsub.`,
          episodes: [{ name: "Tập 1 (Vietsub)", slug: "tap-1", source: "", embed: "", needsEnrich: true }]
        };
        const keys = this.getCanonicalMovieKeys(newMovie);
        let existingDup = null;
        for (let ki = 0; ki < keys.length; ki++) {
          const k = keys[ki];
          if (k && this.canonicalKeyMap.has(k)) {
            const owner = this.canonicalKeyMap.get(k);
            if (this.canMergeMovies(owner, newMovie)) {
              existingDup = owner;
              break;
            }
          }
        }
        if (existingDup && this.canMergeMovies(existingDup, newMovie)) {
          this.mergeBestQualityMovie(existingDup, newMovie);
          this.slugMap.set(newMovie.slug, existingDup);
          keys.forEach((k) => { if (k) this.canonicalKeyMap.set(k, existingDup); });
          if (!localMatches.includes(existingDup)) localMatches.push(existingDup);
          return;
        }
        this.movies.unshift(newMovie);
        this.slugMap.set(newMovie.slug, newMovie);
        keys.forEach((k) => { if (k) this.canonicalKeyMap.set(k, newMovie); });
        localMatches.push(newMovie);
      });
    }

    // Nguồn 3: Film4K Suggest API (4K Ultra HD & Vietsub / Song Ngữ)
    if (film4kSugRes && Array.isArray(film4kSugRes.list)) {
      film4kSugRes.list.forEach((fItem) => {
        const normalizedF4k = this.normalizeFilm4kItem(fItem);
        if (!normalizedF4k) return;
        const keys = this.getCanonicalMovieKeys(normalizedF4k);
        let existingDup = this.slugMap.get(normalizedF4k.slug);
        if (!existingDup) {
          for (let ki = 0; ki < keys.length; ki++) {
            const k = keys[ki];
            if (k && this.canonicalKeyMap.has(k)) {
              const owner = this.canonicalKeyMap.get(k);
              if (this.canMergeMovies(owner, normalizedF4k)) {
                existingDup = owner;
                break;
              }
            }
          }
        }
        if (existingDup && this.canMergeMovies(existingDup, normalizedF4k)) {
          this.mergeBestQualityMovie(existingDup, normalizedF4k);
          this.slugMap.set(normalizedF4k.slug, existingDup);
          keys.forEach((k) => { if (k) this.canonicalKeyMap.set(k, existingDup); });
          if (!localMatches.includes(existingDup)) localMatches.push(existingDup);
          return;
        }
        this.movies.unshift(normalizedF4k);
        this.slugMap.set(normalizedF4k.slug, normalizedF4k);
        keys.forEach((k) => { if (k) this.canonicalKeyMap.set(k, normalizedF4k); });
        localMatches.push(normalizedF4k);
      });
    }

    // Nguồn 4: WP API
    if (Array.isArray(remotePosts)) {
      remotePosts.forEach((post) => {
        const normalized = this.normalizeWpPost(post);
        if (normalized && !this.slugMap.has(normalized.slug) && !this.isAdOrSpam(normalized)) {
          this.movies.push(normalized);
          this.slugMap.set(normalized.slug, normalized);
          localMatches.push(normalized);
        }
      });
    }

    // Sắp xếp kết quả trả về theo độ chuẩn xác từ khóa trước, năm phát hành sau
    const scored = localMatches.map((m) => {
      const t = (m.title || "").toLowerCase();
      const o = (m.originTitle || "").toLowerCase();
      const tNorm = m._titleNorm || (m._titleNorm = this.normalizeSearchText(m.title));
      const oNorm = m._originNorm || (m._originNorm = this.normalizeSearchText(m.originTitle));
      let score = 0;
      if (t === q || o === q || (qNorm && (tNorm === qNorm || oNorm === qNorm))) score = 250;
      else if (t.startsWith(q) || (qNorm && tNorm.startsWith(qNorm))) score = 180;
      else if (o.startsWith(q) || (qNorm && oNorm.startsWith(qNorm))) score = 150;
      else if (t.includes(q) || (qNorm && tNorm.includes(qNorm))) score = 110;
      else if (o.includes(q) || (qNorm && oNorm.includes(qNorm))) score = 90;
      else if (qTokens.length > 1 && qTokens.every((tk) => `${tNorm} ${oNorm}`.includes(tk))) score = 80;
      else score = 30;
      return { movie: m, score };
    });
    scored.sort((a, b) => b.score - a.score || (b.movie.year || 0) - (a.movie.year || 0));
    const dedupedResults = [];
    const seenSearchSlugs = new Set();
    const seenSearchKeys = new Set();
    const keyToMovieMap = new Map();
    for (let si = 0; si < scored.length; si++) {
      const m = scored[si].movie;
      if (!m || !m.slug) continue;
      const keys = this.getCanonicalMovieKeys(m);
      const isSlugSeen = seenSearchSlugs.has(m.slug) || (m.crawlSlug && seenSearchSlugs.has(m.crawlSlug));
      const matchedKey = keys.find((k) => k && seenSearchKeys.has(k) && this.canMergeMovies(keyToMovieMap.get(k), m));
      if (isSlugSeen || matchedKey) {
        const existing = (matchedKey && keyToMovieMap.get(matchedKey)) || this.slugMap.get(m.slug);
        if (existing && existing !== m && this.canMergeMovies(existing, m)) {
          this.mergeBestQualityMovie(existing, m);
        }
        continue;
      }
      seenSearchSlugs.add(m.slug);
      if (m.crawlSlug) seenSearchSlugs.add(m.crawlSlug);
      keys.forEach((k) => {
        if (k) {
          seenSearchKeys.add(k);
          keyToMovieMap.set(k, m);
        }
      });
      dedupedResults.push(m);
    }
    if (this._smartCache) {
      this._smartCache.set(cacheKey, { timestamp: Date.now(), results: dedupedResults });
    }
    return dedupedResults;
  }

  /**
   * Lấy đầy đủ danh sách tập phim & đa nguồn phát Vietsub / Lồng Tiếng / Thuyết Minh
   * Kết hợp đồng thời: PhimAPI (Netflix/KKPhim HLS + Embed) + NguonC (StreamC Vietsub Embed) + WP API
   * Tự động dò tìm theo tên phim nếu slug bị lệch để luôn lấy được nhiều luồng chất lượng thật nhất.
   */
  async enrichMovieStreams(movie, force = false) {
    if (!movie) return movie;
    if (!force && movie._isEnriched && movie.episodes && movie.episodes.length > 0 && movie.episodes[0].source) {
      return movie;
    }
    // Tuyệt đối không xóa hậu tố năm phát hành 4 chữ số (19xx hoặc 20xx)
    // Chỉ xóa hậu tố số thứ tự bài đăng trùng lặp như -2, -3 hoặc ID ngắn
    const hasYearSuffix = /-(19\d\d|20\d\d)$/.test(movie.slug);
    const slugToTry = movie.crawlSlug || (hasYearSuffix ? movie.slug : movie.slug.replace(/-(?!(19\d\d|20\d\d)$)\d+$/, ""));

    // Slug Aliases Map để tự động liên kết đa nguồn chuẩn xác cho các phim điện ảnh lớn (Godzilla, Ramayana, Mai...)
    const SLUG_ALIASES = {
      "mai": { phimApi: "mai-2024", nguonc: "mai-2024", film4k: "mai-2024" },
      "mai-2024": { phimApi: "mai-2024", nguonc: "mai-2024", film4k: "mai-2024" },
      "tro-choi-nghin-ty": { phimApi: "tro-choi-nghin-ty-2025", nguonc: "tro-choi-nghin-ty-2025", film4k: "trillion-game-the-movie" },
      "ke-xau": { phimApi: "ke-xau-2025", nguonc: "ke-xau-2025", film4k: "bad-man" },
      "bi-mat-sau-bua-tiec": { phimApi: "bi-mat-sau-bua-tiec-2025", nguonc: "bi-mat-sau-bua-tiec-2025", film4k: "anniversary" },
      "buoc-duong-cung": { phimApi: "buoc-duong-cung-2025", nguonc: "buoc-duong-cung-2025", film4k: "no-other-choice" },
      "goc-khuat": { phimApi: "goc-khuat-phim-le-2025", nguonc: "goc-khuat-phim-le-2025", film4k: "sharp-corner" },
      "nhat-ky-tinh-yeu": { phimApi: "nhat-ky-tinh-yeu-2004", nguonc: "nhat-ky-tinh-yeu-2004", film4k: "the-notebook" },
      "duoc-an-ca-nga-ve-khong": { phimApi: "duoc-an-ca-nga-ve-khong-2023", nguonc: "duoc-an-ca-nga-ve-khong-2023", film4k: "no-more-bets" },
      "toi-ac-kinh-hoang": { phimApi: "toi-ac-kinh-hoang-2023", nguonc: "toi-ac-kinh-hoang-2023", film4k: "the-worst-of-evil" },
      "dai-chien-robot": { phimApi: "transformers-robot-dai-chien", nguonc: "transformers-robot-dai-chien", film4k: "transformers" },
      "biet-doi-huy-diet": { phimApi: "biet-doi-dap-pha", nguonc: "biet-doi-dap-pha", film4k: "the-wrecking-crew" },
      "made-in-korea": { phimApi: "de-che-dai-han-phan-1", nguonc: "de-che-dai-han-phan-1", film4k: "made-in-korea" },
      "lanh-dia-tu-chien": { phimApi: "lanh-dia-tu-chien-phan-1", nguonc: "lanh-dia-tu-chien-phan-1", film4k: "mobland" },
      "good-boy-18": { phimApi: "kien-tuong", nguonc: "kien-tuong", film4k: "good-boy" },
      "head-over-heels-24": { phimApi: "nguu-lang-chuc-nu", nguonc: "nguu-lang-chuc-nu", film4k: "head-over-heels" },
      "godzilla-minus-one": { phimApi: "godzilla-tru-mot", nguonc: "godzilla-minus-one", film4k: "godzilla-minus-one" },
      "godzilla-tru-mot": { phimApi: "godzilla-tru-mot", nguonc: "godzilla-minus-one", film4k: "godzilla-minus-one" },
      "godzilla-tru-khong": { phimApi: "godzilla-tru-mot", nguonc: "godzilla-minus-one", film4k: "godzilla-minus-one" },
      "godzilla-minus-zero": { phimApi: "godzilla-tru-mot", nguonc: "godzilla-minus-one", film4k: "godzilla-minus-one" },
      "nguoi-nhen-khoi-dau-moi": { phimApi: "nguoi-nhen-khoi-dau-moi", nguonc: "nguoi-nhen-khoi-dau-moi", film4k: "spider-man-brand-new-day" },
      "spider-man-brand-new-day": { phimApi: "nguoi-nhen-khoi-dau-moi", nguonc: "nguoi-nhen-khoi-dau-moi", film4k: "spider-man-brand-new-day" },
      "godzilla-dai-chien-kong": { phimApi: "godzilla-dai-chien-kong", nguonc: "godzilla-dai-chien-kong", film4k: "godzilla-vs-kong" },
      "godzilla-vs-kong": { phimApi: "godzilla-dai-chien-kong", nguonc: "godzilla-dai-chien-kong", film4k: "godzilla-vs-kong" },
      "godzilla-x-kong-de-che-moi": { phimApi: "godzilla-x-kong-de-che-moi", nguonc: "godzilla-x-kong-de-che-moi", film4k: "godzilla-x-kong-the-new-empire" },
      "godzilla-x-kong-the-new-empire": { phimApi: "godzilla-x-kong-de-che-moi", nguonc: "godzilla-x-kong-de-che-moi", film4k: "godzilla-x-kong-the-new-empire" },
      "nguoi-nhen-khong-con-nha": { phimApi: "nguoi-nhen-khong-con-nha", nguonc: "nguoi-nhen-khong-con-nha", film4k: "spider-man-no-way-home" },
      "spider-man-no-way-home": { phimApi: "nguoi-nhen-khong-con-nha", nguonc: "nguoi-nhen-khong-con-nha", film4k: "spider-man-no-way-home" },
      "nguoi-nhen-tro-ve-nha": { phimApi: "nguoi-nhen-tro-ve-nha", nguonc: "nguoi-nhen-tro-ve-nha", film4k: "spider-man-homecoming" },
      "spider-man-homecoming": { phimApi: "nguoi-nhen-tro-ve-nha", nguonc: "nguoi-nhen-tro-ve-nha", film4k: "spider-man-homecoming" },
      "nguoi-nhen-xa-nha": { phimApi: "nguoi-nhen-xa-nha", nguonc: "nguoi-nhen-xa-nha", film4k: "spider-man-far-from-home" },
      "spider-man-far-from-home": { phimApi: "nguoi-nhen-xa-nha", nguonc: "nguoi-nhen-xa-nha", film4k: "spider-man-far-from-home" },
      "hope-vung-tu-dia": { phimApi: "vung-tu-dia", nguonc: "vung-tu-dia", film4k: "hope" },
      "ke-tao-mua": { phimApi: "nguoi-tao-mua", nguonc: "nguoi-tao-mua", film4k: "the-rainmaker" },
      "love-class-phan-3": { phimApi: "lop-hoc-tinh-yeu-phan-3", nguonc: "lop-hoc-tinh-yeu-phan-3", film4k: "love-class-s3" },
      "sieu-trom-lupin-phan-4": { phimApi: "lupin-phan-4", nguonc: "lupin-phan-4", film4k: "lupin-s4" },
      "tham-tu-lung-danh-conan-1-qua-bom-choc-troi": { phimApi: "tham-tu-lung-danh-conan-qua-bom-choc-troi", nguonc: "tham-tu-lung-danh-conan-qua-bom-choc-troi", film4k: "detective-conan-the-time-bombed-skyscraper" },
      "ramayana": { phimApi: "ramayana", nguonc: "ramayana-rise-of-a-legend", film4k: "ramayana-rise-of-a-legend" },
      "ramayana-rise-of-a-legend": { phimApi: "ramayana", nguonc: "ramayana-rise-of-a-legend", film4k: "ramayana-rise-of-a-legend" },
      "ramayana-khoi-nguon-mot-huyen-thoai": { phimApi: "ramayana", nguonc: "ramayana-rise-of-a-legend", film4k: "ramayana-rise-of-a-legend" }
    };

    const alias = SLUG_ALIASES[movie.slug] || SLUG_ALIASES[slugToTry];
    const phimApiSlug = alias?.phimApi || slugToTry;
    const nguoncSlug = alias?.nguonc || slugToTry;
    const f4kSlugCandidate = alias?.film4k || movie.film4kSlug || slugToTry;

    let [phimApiRes, nguoncRes, film4kRes] = await Promise.all([
      this.smartFetchJson(`${PHIMMOI_CONFIG.phimApiBase}${encodeURIComponent(phimApiSlug)}`, 2800),
      this.smartFetchJson(`${PHIMMOI_CONFIG.nguoncApiBase}${encodeURIComponent(nguoncSlug)}`, 2400),
      this.smartFetchJson(`${PHIMMOI_CONFIG.film4kApiWatch}${encodeURIComponent(f4kSlugCandidate)}`, 2400)
    ]);
    const wpPosts = null;

    // Nếu Film4K chưa khớp theo slug trực tiếp, tìm nhanh theo tên tiếng Anh / tiếng Việt trên Film4K Suggest API
    if ((!film4kRes || !film4kRes.movie) && (movie.originTitle || movie.title)) {
      const f4kQuery = (movie.originTitle && movie.originTitle.length >= 2) ? movie.originTitle : movie.title;
      const f4kSug = await this.smartFetchJson(
        `${PHIMMOI_CONFIG.film4kApiSuggest}${encodeURIComponent(f4kQuery)}`,
        2200
      );
      const f4kList = f4kSug?.list;
      if (Array.isArray(f4kList) && f4kList.length > 0) {
        const cleanVi = this.normalizeSearchText(movie.title || "");
        const cleanEn = this.normalizeSearchText(movie.originTitle || "");
        const movYear = parseInt(movie.year, 10);
        let bestF4k = null;
        let bestF4kScore = -999;

        f4kList.forEach((it) => {
          if (!it || !it.slug) return;
          let score = 0;
          const itVi = this.normalizeSearchText((it.title && it.title.vi) || "");
          const itEn = this.normalizeSearchText((it.title && it.title.en) || "");
          const itYr = parseInt(it.year, 10);

          if (it.slug === movie.slug || it.slug === slugToTry) score += 200;
          if (cleanEn && itEn === cleanEn) score += 100;
          else if (cleanEn && cleanEn.length >= 8 && itEn.includes(cleanEn)) score += 35;
          if (cleanVi && itVi === cleanVi) score += 100;
          else if (cleanVi && cleanVi.length >= 8 && itVi.includes(cleanVi)) score += 35;

          const itIsSer = it.mediaType === "tv" || it.mediaType === "series" || Boolean(it.totalSeasons);
          const movIsSingle = movie.type === "single" && (movie.episodes?.length || 1) <= 2;
          if (movIsSingle && itIsSer) score -= 500;

          if (score > 0 && !isNaN(movYear) && !isNaN(itYr)) {
            const diff = Math.abs(movYear - itYr);
            if (diff === 0) score += 140;
            else if (diff === 1) score += 70;
            else score -= 350;
          }
          if (score > bestF4kScore) {
            bestF4kScore = score;
            bestF4k = it;
          }
        });

        if (bestF4k && bestF4kScore >= 180 && bestF4k.slug) {
          movie.film4kSlug = bestF4k.slug;
          film4kRes = await this.smartFetchJson(
            `${PHIMMOI_CONFIG.film4kApiWatch}${encodeURIComponent(bestF4k.slug)}`,
            3000
          );
        }
      }
    }

    // Nếu slug có hậu tố số hoặc khác chuẩn khiến PhimAPI chưa khớp, tự động tìm theo tên phim để lấy luồng .m3u8 thật
    if ((!phimApiRes || !Array.isArray(phimApiRes.episodes) || phimApiRes.episodes.length === 0) && movie.title) {
      const searchRes = await this.smartFetchJson(
        `${PHIMMOI_CONFIG.phimApiSearch}?keyword=${encodeURIComponent(movie.title)}&limit=6`,
        4500
      );
      const items = searchRes?.data?.items;
      if (Array.isArray(items) && items.length > 0) {
        const cleanTarget = movie.title.toLowerCase().trim();
        const originTarget = (movie.originTitle || "").toLowerCase().trim();
        const movieYear = parseInt(movie.year, 10);

        let bestHit = null;
        let highestScore = -999;

        items.forEach((it) => {
          let score = 0;
          const itName = (it.name || "").toLowerCase().trim();
          const itOrigin = (it.origin_name || "").toLowerCase().trim();
          const itYear = parseInt(it.year, 10);

          if (it.slug === movie.slug || it.slug === slugToTry) score += 200;
          if (itName === cleanTarget) score += 60;
          else if (cleanTarget && cleanTarget.length >= 6 && itName.includes(cleanTarget)) score += 25;
          if (originTarget && itOrigin === originTarget) score += 60;
          else if (originTarget && originTarget.length >= 6 && itOrigin.includes(originTarget)) score += 20;

          if (score > 0 && !isNaN(movieYear) && !isNaN(itYear)) {
            const yearDiff = Math.abs(movieYear - itYear);
            if (yearDiff === 0) {
              score += 150;
            } else if (yearDiff === 1) {
              score += 80;
            } else {
              // Khác năm nặng (VD: 2014 vs 1998, 2005 vs 2015) -> Trừ điểm triệt để
              score -= 400;
            }
          }

          if (score > highestScore) {
            highestScore = score;
            bestHit = it;
          }
        });

        if (bestHit && highestScore >= 120 && bestHit.slug) {
          movie.crawlSlug = bestHit.slug;
          phimApiRes = await this.smartFetchJson(`${PHIMMOI_CONFIG.phimApiBase}${encodeURIComponent(bestHit.slug)}`, 5000);
        }
      }
    }

    // Nếu NguonC chưa khớp với slug chuẩn, tự động tìm kiếm trên NguonC để lấy thêm Server 2 sạch quảng cáo
    if ((!nguoncRes || !nguoncRes.movie) && movie.title) {
      const ncSearch = await this.smartFetchJson(
        `${PHIMMOI_CONFIG.nguoncApiSearch}?keyword=${encodeURIComponent(movie.title)}`,
        3500
      );
      const ncItems = ncSearch?.items || ncSearch?.data?.items;
      if (Array.isArray(ncItems) && ncItems.length > 0) {
        const cleanTarget = movie.title.toLowerCase().trim();
        const originTarget = (movie.originTitle || "").toLowerCase().trim();
        const movieYear = parseInt(movie.year, 10);

        let bestNc = null;
        let highestNcScore = -999;

        ncItems.forEach((it) => {
          let score = 0;
          const itName = (it.name || "").toLowerCase().trim();
          const itOrigin = (it.origin_name || "").toLowerCase().trim();
          const itYear = parseInt(it.year, 10);

          if (it.slug === movie.slug || it.slug === slugToTry) score += 200;
          if (itName === cleanTarget) score += 60;
          else if (cleanTarget && cleanTarget.length >= 6 && itName.includes(cleanTarget)) score += 25;
          if (originTarget && itOrigin === originTarget) score += 60;

          if (score > 0 && !isNaN(movieYear) && !isNaN(itYear)) {
            const yearDiff = Math.abs(movieYear - itYear);
            if (yearDiff === 0) score += 150;
            else if (yearDiff === 1) score += 80;
            else score -= 400;
          }

          if (score > highestNcScore) {
            highestNcScore = score;
            bestNc = it;
          }
        });

        if (bestNc && highestNcScore >= 120 && bestNc.slug) {
          nguoncRes = await this.smartFetchJson(`${PHIMMOI_CONFIG.nguoncApiBase}${encodeURIComponent(bestNc.slug)}`, 4500);
        }
      }
    }

    const isExpectingSingle = movie.type === "single" && (movie.episodes?.length || 1) <= 2;

    // 1. Nguồn PhimAPI (Netflix / KKPhim Vietsub #1 + Lồng Tiếng / Thuyết Minh + Các luồng Server phụ)
    if (phimApiRes && Array.isArray(phimApiRes.episodes) && phimApiRes.episodes.length > 0) {
      const resYear = parseInt(phimApiRes.movie?.year, 10);
      const movYear = parseInt(movie.year, 10);
      const isYearCompatible = isNaN(resYear) || isNaN(movYear) || Math.abs(resYear - movYear) <= 1;
      const apiCountries = Array.isArray(phimApiRes.movie?.country) ? phimApiRes.movie.country : [];
      const isCountryCompatible =
        movie.countrySlug !== "viet-nam" ||
        apiCountries.length === 0 ||
        apiCountries.some((c) => c && c.slug === "viet-nam");
      const firstSrvLen = phimApiRes.episodes[0]?.server_data?.length || 0;
      const isTypeCompatible = !isExpectingSingle || firstSrvLen <= 2;

      if (isYearCompatible && isCountryCompatible && isTypeCompatible) {
        const allServers = phimApiRes.episodes;
        // Sắp xếp các server để ưu tiên server VIP, 4K, FHD có tốc độ cao nhất
        const sortedServers = [...allServers].sort((a, b) => {
          const nameA = (a.server_name || "").toLowerCase();
          const nameB = (b.server_name || "").toLowerCase();
          const score = (name) => {
            if (name.includes("4k") || name.includes("uhd")) return 100;
            if (name.includes("vip") || name.includes("fhd") || name.includes("1080")) return 80;
            if (name.includes("vietsub") && !name.includes("trailer")) return 60;
            return 30;
          };
          return score(nameB) - score(nameA);
        });
        const primaryServer = sortedServers[0] || allServers[0];
        const serverData1 = primaryServer.server_data || [];
        if (serverData1.length > 0) {
          const parsedEps = serverData1
            .filter((ep) => ep.link_m3u8 || ep.link_embed)
            .map((ep, idx) => {
              const rawName = ep.name || `Tập ${idx + 1}`;
              // Gom tất cả các luồng .m3u8 khác nhau của cùng tập phim từ các server trong PhimAPI
              const altSources = [];
              sortedServers.forEach((srv, sIdx) => {
                const candidateEp = srv.server_data?.[idx];
                if (candidateEp && candidateEp.link_m3u8) {
                  altSources.push({
                    id: `srv-${sIdx}`,
                    label: srv.server_name || `Server #${sIdx + 1}`,
                    source: candidateEp.link_m3u8,
                    embed: candidateEp.link_embed || ""
                  });
                }
              });
              const prevEp = movie.episodes?.[idx];
              const prevSource =
                prevEp?.source && !prevEp.source.includes("opstream") ? prevEp.source : "";
              return {
                name: rawName.startsWith("Tập") || rawName.includes("Full") ? rawName : `Tập ${rawName}`,
                slug: ep.slug || `tap-${idx + 1}`,
                source: ep.link_m3u8 || prevSource || "",
                embed: ep.link_embed || prevEp?.embed || "",
                altSources
              };
            });
          if (parsedEps.length > 0) {
            movie.episodes = parsedEps;
          }
        }
        // Server 2: Lồng Tiếng / Thuyết Minh (Chỉ nhận server nếu thực sự có từ khóa thuyết minh/lồng tiếng)
        const dubServer = allServers.find((srv) => {
          const sn = (srv.server_name || "").toLowerCase();
          return sn.includes("thuyết minh") || sn.includes("lồng tiếng") || sn.includes("thuyet minh") || sn.includes("long tieng") || sn.includes("dub");
        });
        if (dubServer && dubServer.server_data && dubServer.server_data.length > 0) {
          movie.dubEpisodes = dubServer.server_data
            .filter((ep) => ep.link_m3u8 || ep.link_embed)
            .map((ep, idx) => ({
              name: ep.name || `Tập ${idx + 1}`,
              slug: ep.slug || `tap-${idx + 1}`,
              source: ep.link_m3u8 || "",
              embed: ep.link_embed || ""
            }));
        } else {
          movie.dubEpisodes = [];
        }
        if (phimApiRes.movie) {
          if (phimApiRes.movie.thumb_url) {
            const hdThumb = phimApiRes.movie.thumb_url.startsWith("http") ? phimApiRes.movie.thumb_url : `https://phimimg.com/${phimApiRes.movie.thumb_url.replace(/^\//, "")}`;
            if (hdThumb && (!movie.backdrop || movie.backdrop.includes("phimmoiz.one") || movie.backdrop === movie.poster)) {
              movie.backdrop = hdThumb;
            }
          }
          if (phimApiRes.movie.poster_url) {
            const hdPoster = phimApiRes.movie.poster_url.startsWith("http") ? phimApiRes.movie.poster_url : `https://phimimg.com/${phimApiRes.movie.poster_url.replace(/^\//, "")}`;
            if (hdPoster && (!movie.poster || movie.poster.includes("phimmoiz.one"))) {
              movie.poster = hdPoster;
            }
          }
          if (phimApiRes.movie.quality) {
            movie.nativeQuality = phimApiRes.movie.quality;
            const rawApiQ = String(phimApiRes.movie.quality || "").toUpperCase();
            const has4kFromApi =
              rawApiQ.includes("4K") ||
              rawApiQ.includes("UHD") ||
              rawApiQ.includes("2160") ||
              movie.quality === "4K" ||
              movie.has4k === true ||
              (Array.isArray(movie.sectionTags) && movie.sectionTags.includes("4k"));
            if (has4kFromApi) {
              movie.quality = "4K";
              movie.has4k = true;
              if (!Array.isArray(movie.sectionTags)) movie.sectionTags = ["hot", "vietsub"];
              if (!movie.sectionTags.includes("4k")) movie.sectionTags.push("4k");
            } else {
              movie.quality = "1080";
            }
          }
          if (phimApiRes.movie.trailer_url && !movie.trailerUrl) {
            movie.trailerUrl = phimApiRes.movie.trailer_url;
          }
          if (phimApiRes.movie.content) {
            const clean = this.cleanAdText(this.stripHtml(phimApiRes.movie.content));
            if (clean.length > (movie.synopsis || "").length) movie.synopsis = clean;
          }
        }
      }
    }

    // 2. Nguồn NguonC (StreamC Vietsub CDN + Thuyết Minh)
    if (nguoncRes && nguoncRes.movie && Array.isArray(nguoncRes.movie.episodes)) {
      const ncYear = parseInt(nguoncRes.movie.year, 10);
      const movYear = parseInt(movie.year, 10);
      const isNcYearCompatible = isNaN(ncYear) || isNaN(movYear) || Math.abs(ncYear - movYear) <= 1;
      const ncEpCount = nguoncRes.movie.episodes[0]?.items?.length || 0;
      const isNcTypeCompatible = !isExpectingSingle || ncEpCount <= 2;

      if (isNcYearCompatible && isNcTypeCompatible) {
        const ncServers = nguoncRes.movie.episodes;
        if (ncServers[0] && Array.isArray(ncServers[0].items) && ncServers[0].items.length > 0) {
          movie.nguoncEpisodes = ncServers[0].items.map((item, idx) => ({
            name: item.name?.startsWith("Tập") || item.name === "Full" ? item.name : `Tập ${item.name || idx + 1}`,
            slug: item.slug || `tap-${idx + 1}`,
            source: item.m3u8 || "",
            embed: item.embed || ""
          }));
          // Nếu NguonC có luồng m3u8 riêng, bổ sung vào altSources của tập tương ứng
          movie.nguoncEpisodes.forEach((ncEp, idx) => {
            if (ncEp.source && movie.episodes?.[idx]) {
              movie.episodes[idx].altSources = movie.episodes[idx].altSources || [];
              if (!movie.episodes[idx].altSources.some((a) => a.source === ncEp.source)) {
                movie.episodes[idx].altSources.push({
                  id: `nguonc-${idx}`,
                  label: "StreamC FHD",
                  source: ncEp.source,
                  embed: ncEp.embed || ""
                });
              }
            }
          });
          // Nếu nguồn chính chỉ có 1 tập mẫu mà NguonC có nhiều tập hơn thì cập nhật luôn (chỉ áp dụng cho phim bộ)
          if (!isExpectingSingle && movie.nguoncEpisodes.length > (movie.episodes ? movie.episodes.length : 0)) {
            movie.episodes = movie.nguoncEpisodes.map((ep, i) => {
              const prevEp = movie.episodes?.[i];
              const prevSource =
                prevEp?.source && !prevEp.source.includes("opstream") ? prevEp.source : "";
              return {
                ...ep,
                source: prevSource || ep.source || ""
              };
            });
          }
        }
        const ncDubServer = ncServers.find((srv) => {
          const sn = (srv.server_name || srv.name || "").toLowerCase();
          return sn.includes("thuyết minh") || sn.includes("lồng tiếng") || sn.includes("thuyet minh") || sn.includes("long tieng") || sn.includes("dub");
        });
        if (ncDubServer && Array.isArray(ncDubServer.items) && (!movie.dubEpisodes || movie.dubEpisodes.length === 0)) {
          movie.dubEpisodes = ncDubServer.items.map((item, idx) => ({
            name: `Tập ${item.name || idx + 1}`,
            slug: item.slug || `tap-${idx + 1}`,
            source: item.m3u8 || "",
            embed: item.embed || ""
          }));
        }
      }
    }

    // 3. Nguồn Film4K (https://film4k.net/ - Link Vietsub, API Phụ Đề Song Ngữ WebVTT & Định Dạng 4K UHD Thực Tế)
    if (film4kRes && film4kRes.movie) {
      const f4kMov = film4kRes.movie;
      const f4kYear = parseInt(f4kMov.year, 10);
      const movYear = parseInt(movie.year, 10);
      const isF4kYearOk = isNaN(f4kYear) || isNaN(movYear) || Math.abs(f4kYear - movYear) <= 1;
      const f4kEpLen = Array.isArray(film4kRes.episodes) ? film4kRes.episodes.length : 0;
      const isF4kTypeOk = !isExpectingSingle || f4kEpLen <= 2;

      if (isF4kYearOk && isF4kTypeOk) {
        movie.film4kSlug = f4kMov.slug || movie.film4kSlug;
        if (f4kMov.overview?.en && !movie.overviewEn) movie.overviewEn = f4kMov.overview.en;
        if (f4kMov.overview?.vi && !movie.overviewVi) movie.overviewVi = f4kMov.overview.vi;

        const f4kMaxRes = String(f4kMov.maxRes || "").toUpperCase();
        const isF4k4k = Boolean(
          f4kMaxRes === "4K" ||
          f4kMaxRes.includes("2160") ||
          Number(f4kMov.maxHeight) >= 2160
        );
        if (isF4k4k) {
          movie.quality = "4K";
          movie.has4k = true;
          movie.hasReal4k = true;
          if (!Array.isArray(movie.sectionTags)) movie.sectionTags = ["hot", "vietsub"];
          if (!movie.sectionTags.includes("4k")) movie.sectionTags.push("4k");
        }
        if (Array.isArray(movie.sectionTags) && !movie.sectionTags.includes("film4k")) {
          movie.sectionTags.push("film4k");
        }

        const toAbsF4kUrl = (u) => {
          if (!u || typeof u !== "string") return "";
          return u.startsWith("http") ? u : `${PHIMMOI_CONFIG.film4kBase}${u.startsWith("/") ? "" : "/"}${u}`;
        };

        const f4kEps = Array.isArray(film4kRes.episodes) ? film4kRes.episodes : [];
        if (f4kEps.length > 0) {
          movie.film4kEpisodes = f4kEps
            .map((epItem, idx) => {
              const firstSrc = Array.isArray(epItem.sources) ? epItem.sources[0]?.url : epItem.hlsUrl || "";
              const absUrl = toAbsF4kUrl(firstSrc);
              if (!absUrl) return null;
              const epNum = epItem.episode || idx + 1;
              return {
                name: `Tập ${epNum}`,
                slug: `tap-${epNum}`,
                source: absUrl,
                isFilm4k: true,
                is4k: isF4k4k
              };
            })
            .filter(Boolean);
        } else {
          const singleSrc =
            (Array.isArray(film4kRes.sources) && film4kRes.sources[0]?.url) ||
            f4kMov.hlsUrl ||
            "";
          const absSingle = toAbsF4kUrl(singleSrc);
          if (absSingle) {
            movie.film4kEpisodes = [
              {
                name: isF4k4k ? "Full 4K" : "Full",
                slug: "full",
                source: absSingle,
                isFilm4k: true,
                is4k: isF4k4k
              }
            ];
          }
        }

        if (Array.isArray(movie.film4kEpisodes) && movie.film4kEpisodes.length > 0) {
          const f4kLabel = isF4k4k ? "Film4K UHD • Vietsub" : "Film4K FHD • Vietsub";

          // Khi phim có nguồn 4K thật (2160p / UHD): So sánh, thay thế và update luồng 4K làm nguồn chính mặc định
          if (isF4k4k) {
            movie.quality = "4K";
            movie.has4k = true;
            movie.hasReal4k = true;
            if (!Array.isArray(movie.sectionTags)) movie.sectionTags = ["hot", "vietsub"];
            if (!movie.sectionTags.includes("4k")) movie.sectionTags.push("4k");
            if (!movie.sectionTags.includes("film4k")) movie.sectionTags.push("film4k");

            const oldEps = Array.isArray(movie.episodes) ? movie.episodes : [];
            movie.episodes = movie.film4kEpisodes.map((fEp, idx) => {
              const oldEp = oldEps[idx];
              const oldSource = oldEp?.source;
              const mergedAlts = Array.isArray(oldEp?.altSources) ? [...oldEp.altSources] : [];

              // Lưu nguồn FHD 1080p cũ vào Server dự phòng để người dùng có thể đổi nếu muốn
              if (oldSource && oldSource !== fEp.source && !mergedAlts.some((a) => a.source === oldSource)) {
                mergedAlts.push({
                  id: `backup-fhd-${idx}`,
                  label: "Server Dự Phòng (FHD 1080p)",
                  source: oldSource,
                  embed: oldEp?.embed || "",
                  isFilm4k: false,
                  is4k: false
                });
              }

              // Đảm bảo luồng 4K đứng đầu danh sách server
              if (!mergedAlts.some((a) => a.source === fEp.source)) {
                mergedAlts.unshift({
                  id: `film4k-${idx}`,
                  label: f4kLabel,
                  source: fEp.source,
                  embed: "",
                  isFilm4k: true,
                  is4k: true
                });
              }

              return {
                name: fEp.name || oldEp?.name || `Tập ${idx + 1}`,
                slug: fEp.slug || oldEp?.slug || `tap-${idx + 1}`,
                source: fEp.source, // Khóa nguồn 4K UHD siêu nét làm luồng phát chính
                embed: oldEp?.embed || "",
                altSources: mergedAlts,
                isFilm4k: true,
                is4k: true
              };
            });
          } else {
            // Không có 4K ("nếu không có thì thôi"): Giữ nguyên nguồn FHD 1080p cao nhất, thêm Film4K vào altSources
            movie.film4kEpisodes.forEach((fEp, idx) => {
              if (fEp.source && movie.episodes?.[idx]) {
                movie.episodes[idx].altSources = movie.episodes[idx].altSources || [];
                if (!movie.episodes[idx].altSources.some((a) => a.source === fEp.source)) {
                  movie.episodes[idx].altSources.push({
                    id: `film4k-${idx}`,
                    label: f4kLabel,
                    source: fEp.source,
                    embed: "",
                    isFilm4k: true,
                    is4k: false
                  });
                }
              }
            });

            // Nếu tập chính chưa có luồng .m3u8 hoặc embed hợp lệ thì mới dùng trực tiếp luồng Film4K
            const hasMainValidSource =
              Array.isArray(movie.episodes) &&
              movie.episodes.some((e) => e && ((e.source && !e.source.includes("opstream") && !e.source.includes("film4k.net")) || (e.embed && (e.embed.includes("youtube") || e.embed.includes("streamc")))));
            if (!hasMainValidSource) {
              const oldEps = Array.isArray(movie.episodes) ? movie.episodes : [];
              movie.episodes = movie.film4kEpisodes.map((fEp, idx) => ({
                ...fEp,
                embed: oldEps[idx]?.embed || fEp.embed || "",
                altSources: [
                  {
                    id: `film4k-${idx}`,
                    label: f4kLabel,
                    source: fEp.source,
                    embed: oldEps[idx]?.embed || fEp.embed || "",
                    isFilm4k: true,
                    is4k: false
                  }
                ]
              }));
            }
          }
        }
      }
    }

    // 4. Nguồn WP API bổ sung
    if (Array.isArray(wpPosts) && wpPosts.length > 0) {
      const fresh = this.normalizeWpPost(wpPosts[0]);
      if (fresh && fresh.episodes && fresh.episodes.length > (movie.episodes ? movie.episodes.length : 0)) {
        movie.episodes = fresh.episodes;
      }
    }

    // 4. Nguồn Hoạt Hình 3D Trung Quốc / Donghua
    const isDonghua =
      (Array.isArray(movie.sectionTags) && movie.sectionTags.includes("hoat-hinh-3d")) ||
      movie.slug === "quang-am-chi-ngoai" ||
      (Array.isArray(movie.genres) && movie.genres.includes("Hoạt Hình 3D"));

    if (isDonghua && Array.isArray(movie.episodes) && movie.episodes.length > 0) {
      movie.episodes.forEach((ep) => {
        const realSource = ep.source || movie.episodes[0]?.source || "";
        if (realSource && (realSource.includes(".m3u8") || realSource.includes("/hls/"))) {
          ep.source = realSource;
          ep.embed = "";
        }
        if (ep.altSources) {
          delete ep.altSources;
        }
      });
    }

    // 5. Chuẩn hóa nhãn ngôn ngữ (Language) chuẩn xác theo thực tế nguồn phát
    const hasRealDub = Boolean(
      (movie.dubEpisodes && movie.dubEpisodes.length > 0) ||
      (movie.episodes && movie.episodes.some((ep) =>
        ep.altSources?.some((a) =>
          (a.label || "").toLowerCase().includes("thuyết minh") ||
          (a.label || "").toLowerCase().includes("lồng tiếng")
        )
      ))
    );
    if (hasRealDub) {
      const isLongTieng = (movie.language || "").toLowerCase().includes("lồng tiếng");
      movie.language = isLongTieng ? "Vietsub + Lồng Tiếng" : "Vietsub + Thuyết Minh";
    } else {
      movie.language = "Vietsub";
    }

    movie._isEnriched = true;
    return movie;
  }

  /**
   * Thuật toán gợi ý "Nội Dung Tương Tự" chuẩn Netflix (More Like This)
   * Tính điểm tương thích dựa trên: Vũ trụ phim (Franchise), Thể loại, Quốc gia, Định dạng, Đạo diễn & Diễn viên
   */
  getRelatedMovies(targetMovie, limit = 9) {
    if (!targetMovie) return [];
    if (Array.isArray(targetMovie._cachedRelated) && targetMovie._cachedRelated.length >= limit) {
      return targetMovie._cachedRelated.slice(0, limit);
    }

    const targetTitleWords = (targetMovie.title || "")
      .toLowerCase()
      .split(/[:\-–()\s]+/)
      .filter((w) => w.length > 3 && !["phim", "phần", "cuộc", "người"].includes(w));
    const targetGenres = targetMovie.genres || [];
    const targetCast = targetMovie.cast || [];
    const scored = [];
    const moviesList = this.movies;
    const total = moviesList.length;

    for (let i = 0; i < total; i++) {
      const candidate = moviesList[i];
      if (!candidate || candidate.slug === targetMovie.slug) continue;

      // Fast pre-filter: skip candidates with zero genre/country/type overlap once we have enough strong candidates
      const hasGenreOverlap = candidate.genres && candidate.genres.some((g) => targetGenres.includes(g));
      const sameCountry = candidate.countrySlug === targetMovie.countrySlug;
      if (!hasGenreOverlap && !sameCountry && scored.length >= 24) continue;

      let score = 55;
      const reasons = [];
      const candTitleLower = candidate._titleLower || (candidate._titleLower = (candidate.title || "").toLowerCase());

      // 1. Cùng series / vũ trụ điện ảnh
      const sharedTitleKey = targetTitleWords.find((w) => candTitleLower.includes(w));
      if (sharedTitleKey) {
        score += 28;
        reasons.push("Cùng series / chủ đề");
      }

      // 2. Cùng thể loại (Genres overlap)
      if (hasGenreOverlap) {
        const sharedGenres = candidate.genres.filter((g) => targetGenres.includes(g));
        score += sharedGenres.length * 9;
        reasons.push(`Cùng thể loại ${sharedGenres.slice(0, 2).join(", ")}`);
      }

      // 3. Cùng quốc gia sản xuất
      if (sameCountry) {
        score += 10;
        reasons.push(`Điện ảnh ${candidate.country}`);
      }

      // 4. Cùng định dạng (Phim bộ / Phim lẻ)
      if (candidate.type === targetMovie.type) {
        score += 6;
      }

      // 5. Cùng đạo diễn hoặc diễn viên
      if (candidate.director === targetMovie.director && candidate.director !== "Đang cập nhật") {
        score += 12;
        reasons.push(`Đạo diễn ${candidate.director}`);
      }
      if (targetCast.length && candidate.cast && candidate.cast.length) {
        const sharedCast = candidate.cast.find((c) => targetCast.includes(c));
        if (sharedCast) {
          score += 10;
          reasons.push(`Có ${sharedCast}`);
        }
      }

      const clampedMatch = Math.min(99, Math.max(82, score));
      scored.push({
        movie: candidate,
        matchPercent: clampedMatch,
        reasons: reasons.length ? reasons.slice(0, 2) : [`Đề xuất cho fan ${targetGenres[0] || "Phim hay"}`]
      });
    }

    scored.sort((a, b) => b.matchPercent - a.matchPercent);
    targetMovie._cachedRelated = scored.slice(0, Math.max(limit, 12));
    return targetMovie._cachedRelated.slice(0, limit);
  }

  /**
   * Đọc danh sách phim đã được người dùng nạp và lưu bền vững trong localStorage
   */
  getPersistedIngestedMovies() {
    try {
      if (typeof localStorage === "undefined") return [];
      const raw = localStorage.getItem("ngwyren_ingested_movies_v1");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((m) => m && m.slug && m.title) : [];
    } catch (_) {
      return [];
    }
  }

  /**
   * Tạo bản sao gọn sạch của đối tượng phim để lưu bền vững vào localStorage (giữ nguyên toàn bộ luồng phát .m3u8 & metadata)
   */
  serializeMovieForPersistence(movie) {
    if (!movie || !movie.slug) return null;
    const cleanEp = (ep) => {
      if (!ep) return null;
      const out = {
        name: ep.name || "Full",
        slug: ep.slug || "full",
        source: ep.source || "",
        embed: ep.embed || ""
      };
      if (ep.is4k) out.is4k = true;
      if (ep.isFilm4k) out.isFilm4k = true;
      if (ep.needsEnrich && !out.source && !out.embed) out.needsEnrich = true;
      if (Array.isArray(ep.altSources) && ep.altSources.length > 0) {
        out.altSources = ep.altSources.slice(0, 4).map((a) => ({
          label: a.label || "Server phụ",
          source: a.source || "",
          embed: a.embed || "",
          is4k: Boolean(a.is4k)
        }));
      }
      return out;
    };

    const eps = Array.isArray(movie.episodes) ? movie.episodes.map(cleanEp).filter(Boolean) : [];
    const dubEps = Array.isArray(movie.dubEpisodes) ? movie.dubEpisodes.map(cleanEp).filter(Boolean) : [];
    const tags = Array.isArray(movie.sectionTags) ? [...new Set(movie.sectionTags)] : ["hot", "de-cu", "vietsub"];
    if (!tags.includes("moi-cap-nhat")) tags.push("moi-cap-nhat");
    if (!tags.includes("vietsub")) tags.push("vietsub");
    const typeTag = movie.type === "series" ? "phim-bo" : "phim-le";
    if (!tags.includes(typeTag)) tags.push(typeTag);

    return {
      id: movie.id || `ing-${movie.slug}`,
      slug: movie.slug,
      crawlSlug: movie.crawlSlug || movie.slug,
      film4kSlug: movie.film4kSlug || "",
      title: movie.title || movie.originTitle || movie.slug,
      originTitle: movie.originTitle || movie.title || movie.slug,
      poster: movie.poster || movie.backdrop || "",
      backdrop: movie.backdrop || movie.poster || "",
      type: movie.type === "series" ? "series" : "single",
      sectionTags: tags,
      quality: movie.quality || "1080",
      has4k: Boolean(movie.has4k),
      hasReal4k: Boolean(movie.hasReal4k),
      language: movie.language || "Vietsub",
      duration: movie.duration || (movie.type === "series" ? "45 phút/tập" : "115 phút"),
      episodeCurrent: movie.episodeCurrent || (movie.type === "series" ? `Tập ${eps.length || 1}` : "Full"),
      episodeTotal: String(movie.episodeTotal || eps.length || 1),
      year: Number(movie.year) || new Date().getFullYear(),
      rating: Number(movie.rating) || 9.0,
      matchScore: Number(movie.matchScore) || 96,
      country: movie.country || "Quốc Tế",
      countrySlug: movie.countrySlug || "quoc-te",
      genres: Array.isArray(movie.genres) && movie.genres.length ? movie.genres.slice(0, 6) : ["Điện Ảnh"],
      director: this.cleanDirector(movie.director, movie.slug, movie.title || movie.originTitle),
      cast: Array.isArray(movie.cast) && movie.cast.length ? movie.cast.slice(0, 10) : ["Dàn diễn viên chính"],
      ambientColors: Array.isArray(movie.ambientColors) ? movie.ambientColors : ["#ffffff", "#d4d4d4", "#a3a3a3"],
      trailerUrl: movie.trailerUrl || "",
      overviewVi: movie.overviewVi || "",
      overviewEn: movie.overviewEn || "",
      synopsis: movie.synopsis || "",
      episodes: eps,
      dubEpisodes: dubEps,
      _userIngested: true,
      _ingestedAt: movie._ingestedAt || Date.now()
    };
  }

  /**
   * Lưu phim mới nạp vào localStorage để tồn tại vĩnh viễn sau mọi lần tải lại trang (F5 / Reload)
   */
  saveIngestedMovie(movie) {
    if (!movie || !movie.slug) return false;
    try {
      if (typeof localStorage === "undefined") return false;
      const serialized = this.serializeMovieForPersistence(movie);
      if (!serialized) return false;

      const list = this.getPersistedIngestedMovies().filter((m) => m && m.slug !== serialized.slug);
      list.unshift(serialized);

      // Giới hạn tối đa 150 phim nạp gần nhất & tự động cắt gọn nếu gần chạm hạn mức bộ nhớ trình duyệt
      let trimmed = list.slice(0, 150);
      while (trimmed.length > 0) {
        try {
          localStorage.setItem("ngwyren_ingested_movies_v1", JSON.stringify(trimmed));
          return true;
        } catch (_) {
          trimmed = trimmed.slice(0, Math.max(1, Math.floor(trimmed.length * 0.75)));
          if (trimmed.length === 1) {
            try {
              localStorage.setItem("ngwyren_ingested_movies_v1", JSON.stringify(trimmed));
              return true;
            } catch (__) {
              return false;
            }
          }
        }
      }
    } catch (_) {}
    return false;
  }

  /**
   * Khôi phục toàn bộ phim đã nạp từ localStorage vào kho chính ngay khi khởi chạy web (0ms)
   */
  loadPersistedIngestedMovies() {
    const persisted = this.getPersistedIngestedMovies();
    if (!persisted.length) return 0;

    let restoredCount = 0;
    // Duyệt ngược để phim nạp gần nhất luôn đứng đầu danh sách
    for (let i = persisted.length - 1; i >= 0; i--) {
      const item = persisted[i];
      if (!item || !item.slug) continue;

      item.director = this.cleanDirector(item.director, item.slug, item.title || item.originTitle);
      item._userIngested = true;
      item._titleLower = (item.title || "").toLowerCase();
      item._originLower = (item.originTitle || "").toLowerCase();
      item._titleNorm = this.normalizeSearchText(item.title);
      item._originNorm = this.normalizeSearchText(item.originTitle);

      const keys = this.getCanonicalMovieKeys(item);
      let existing = this.slugMap.get(item.slug) || (item.crawlSlug && this.slugMap.get(item.crawlSlug));
      if (!existing) {
        for (let ki = 0; ki < keys.length; ki++) {
          const k = keys[ki];
          if (k && this.canonicalKeyMap.has(k)) {
            existing = this.canonicalKeyMap.get(k);
            break;
          }
        }
      }

      if (existing) {
        this.mergeBestQualityMovie(existing, item);
        existing._userIngested = true;
        this.slugMap.set(item.slug, existing);
        if (item.crawlSlug) this.slugMap.set(item.crawlSlug, existing);
        keys.forEach((k) => { if (k) this.canonicalKeyMap.set(k, existing); });
      } else {
        this.movies.unshift(item);
        this.slugMap.set(item.slug, item);
        if (item.crawlSlug) this.slugMap.set(item.crawlSlug, item);
        keys.forEach((k) => { if (k) this.canonicalKeyMap.set(k, item); });
        restoredCount++;
      }
    }
    this.lastSyncedCount = this.movies.length;
    return restoredCount;
  }

  /**
   * Tự động dò tìm trực tuyến đa nguồn (PhimAPI, NguonC, Film4K) và nạp tức thì + lưu bền vững phim mới vào catalog
   */
  async searchAndIngestMovie(query) {
    if (!query || typeof query !== "string") return null;
    const cleanQ = query.trim();
    if (cleanQ.length < 2) return null;

    const finalizeIngested = (movie) => {
      if (!movie || !movie.slug) return movie;
      movie._userIngested = true;
      movie._ingestedAt = Date.now();
      movie.director = this.cleanDirector(movie.director, movie.slug, movie.title || movie.originTitle);
      if (!Array.isArray(movie.sectionTags)) movie.sectionTags = ["hot", "de-cu", "vietsub"];
      if (!movie.sectionTags.includes("moi-cap-nhat")) movie.sectionTags.push("moi-cap-nhat");
      if (!movie.sectionTags.includes("vietsub")) movie.sectionTags.push("vietsub");
      const typeTag = movie.type === "series" ? "phim-bo" : "phim-le";
      if (!movie.sectionTags.includes(typeTag)) movie.sectionTags.push(typeTag);

      movie._titleLower = (movie.title || "").toLowerCase();
      movie._originLower = (movie.originTitle || "").toLowerCase();
      movie._titleNorm = this.normalizeSearchText(movie.title);
      movie._originNorm = this.normalizeSearchText(movie.originTitle);

      const keys = this.getCanonicalMovieKeys(movie);
      const existingIdx = this.movies.indexOf(movie);
      if (existingIdx < 0) {
        this.movies.unshift(movie);
      } else if (existingIdx > 0) {
        this.movies.splice(existingIdx, 1);
        this.movies.unshift(movie);
      }
      this.slugMap.set(movie.slug, movie);
      if (movie.crawlSlug) this.slugMap.set(movie.crawlSlug, movie);
      keys.forEach((k) => { if (k) this.canonicalKeyMap.set(k, movie); });

      if (this._smartCache) this._smartCache.clear();
      this.lastSyncedCount = this.movies.length;
      this.saveIngestedMovie(movie);
      return movie;
    };

    const qLower = cleanQ.toLowerCase();
    const cleanQNorm = this.normalizeSearchText(cleanQ);

    // 1. Kiểm tra xem phim đã có sẵn chính xác trong catalog chưa (chuẩn hóa so khớp tuyệt đối, không dùng includes)
    const existing = this.movies.find((m) => {
      if (!m) return false;
      const t = (m.title || "").toLowerCase();
      const ot = (m.originTitle || "").toLowerCase();
      if (t === qLower || ot === qLower || m.slug === qLower) return true;
      if (cleanQNorm) {
        const tNorm = m._titleNorm || (m._titleNorm = this.normalizeSearchText(m.title));
        const otNorm = m._originNorm || (m._originNorm = this.normalizeSearchText(m.originTitle));
        if (tNorm === cleanQNorm || otNorm === cleanQNorm) return true;
      }
      return false;
    });
    if (existing) {
      await this.enrichMovieStreams(existing);
      return finalizeIngested(existing);
    }

    // 2. Chạy tìm kiếm sâu trên tất cả các API trực tuyến
    const searchResults = await this.searchMovies(cleanQ);
    if (Array.isArray(searchResults) && searchResults.length > 0) {
      // Ưu tiên kết quả khớp nhất với từ khóa yêu cầu
      let best = searchResults.find((m) => {
        if (!m) return false;
        const t = (m.title || "").toLowerCase();
        const ot = (m.originTitle || "").toLowerCase();
        if (t === qLower || ot === qLower || m.slug === qLower) return true;
        const tNorm = m._titleNorm || (m._titleNorm = this.normalizeSearchText(m.title));
        const otNorm = m._originNorm || (m._originNorm = this.normalizeSearchText(m.originTitle));
        return (cleanQNorm && (tNorm === cleanQNorm || otNorm === cleanQNorm));
      }) || searchResults[0];

      if (!best) return null;

      await this.enrichMovieStreams(best);
      const keys = this.getCanonicalMovieKeys(best);
      let existingDup = this.slugMap.get(best.slug);
      if (!existingDup) {
        for (let ki = 0; ki < keys.length; ki++) {
          const k = keys[ki];
          if (k && this.canonicalKeyMap.has(k)) {
            existingDup = this.canonicalKeyMap.get(k);
            break;
          }
        }
      }
      if (existingDup && existingDup !== best) {
        this.mergeBestQualityMovie(existingDup, best);
        this.slugMap.set(best.slug, existingDup);
        keys.forEach((k) => { if (k) this.canonicalKeyMap.set(k, existingDup); });
        return finalizeIngested(existingDup);
      }
      return finalizeIngested(best);
    }
    return null;
  }

  stripHtml(html) {
    // DOMParser tạo document "trơ": không tải ảnh, không chạy onerror/script từ HTML của API
    const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  }

  decodeEntities(str) {
    const txt = document.createElement("textarea");
    txt.innerHTML = str || "";
    return txt.value;
  }
}

// Khởi tạo instance toàn cục
window.phimmoiService = new PhimmoiService();
