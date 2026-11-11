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
      { name: "Tập 1", slug: "tap-01", source: "https://v7.kkphimplayer7.com/20260729/a8XUKTef/index.m3u8" },
      { name: "Tập 2", slug: "tap-02", source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8" },
      { name: "Tập 3", slug: "tap-03", source: "https://a.kvp726.com/20261011/cSOFRRA3/index.m3u8" },
      { name: "Tập 4", slug: "tap-04", source: "https://v7.kkphimplayer7.com/20260729/a8XUKTef/index.m3u8" },
      { name: "Tập 5", slug: "tap-05", source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8" },
      { name: "Tập 6 (End)", slug: "tap-06", source: "https://a.kvp726.com/20261011/cSOFRRA3/index.m3u8" }
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
      { name: "Tập 1", slug: "tap-01", source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8" },
      { name: "Tập 2", slug: "tap-02", source: "https://a.kvp726.com/20261011/cSOFRRA3/index.m3u8" },
      { name: "Tập 3", slug: "tap-03", source: "https://v7.kkphimplayer7.com/20260729/a8XUKTef/index.m3u8" },
      { name: "Tập 4", slug: "tap-04", source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8" }
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
      { name: "Tập 1", slug: "tap-01", source: "https://a.kvp726.com/20261011/cSOFRRA3/index.m3u8" },
      { name: "Tập 2", slug: "tap-02", source: "https://v7.kkphimplayer7.com/20260729/a8XUKTef/index.m3u8" },
      { name: "Tập 3", slug: "tap-03", source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8" }
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
      { name: "Tập 1", slug: "tap-01", source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8" },
      { name: "Tập 2", slug: "tap-02", source: "https://a.kvp726.com/20261011/cSOFRRA3/index.m3u8" }
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
      { name: "Tập 1", slug: "tap-01", source: "https://a.kvp726.com/20261011/cSOFRRA3/index.m3u8" },
      { name: "Tập 2", slug: "tap-02", source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8" }
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
      { name: "Full FHD", slug: "full", source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8" }
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
      { name: "Full FHD", slug: "full", source: "https://v7.kkphimplayer7.com/20260729/a8XUKTef/index.m3u8" }
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
      { name: "Full FHD", slug: "full", source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8" }
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
      { name: "Full FHD", slug: "full", source: "https://a.kvp726.com/20261011/cSOFRRA3/index.m3u8" }
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
      { name: "Full FHD", slug: "full", source: "https://a.kvp726.com/20261011/cSOFRRA3/index.m3u8" }
    ]
  },
  {
    id: "pm-14",
    slug: "good-boy-18",
    crawlSlug: "good-boy",
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
      { name: "Tập 1", slug: "tap-01", source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8" },
      { name: "Tập 2", slug: "tap-02", source: "https://v7.kkphimplayer7.com/20260729/a8XUKTef/index.m3u8" }
    ]
  },
  {
    id: "pm-15",
    slug: "head-over-heels-24",
    crawlSlug: "head-over-heels",
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
      { name: "Tập 1", slug: "tap-01", source: "https://v7.kkphimplayer7.com/20260729/a8XUKTef/index.m3u8" },
      { name: "Tập 2", slug: "tap-02", source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8" }
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
      { name: "Tập 1", slug: "tap-01", source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8" },
      { name: "Tập 2", slug: "tap-02", source: "https://v7.kkphimplayer7.com/20260729/a8XUKTef/index.m3u8" }
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
      { name: "Tập 1", slug: "tap-01", source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8" }
    ]
  },
  {
    id: "pm-18",
    slug: "thanh-guom-diet-quy-lang-tho-ren",
    crawlSlug: "thanh-guom-diet-quy-lang-tho-ren",
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
      { name: "Tập 1", slug: "tap-01", source: "https://v7.kkphimplayer7.com/20260729/a8XUKTef/index.m3u8" },
      { name: "Tập 2", slug: "tap-02", source: "https://v7.kkphimplayer7.com/20260729/a8XUKTef/index.m3u8" }
    ]
  },
  {
    id: "pm-19",
    slug: "thanh-guom-diet-quy-ky-vien-tran",
    crawlSlug: "thanh-guom-diet-quy-ky-vien-tran",
    title: "Thanh Gươm Diệt Quỷ: Kỹ Viện Trấn",
    originTitle: "Demon Slayer (Season 3) (Entertainment District Arc)",
    poster: "https://phimimg.com/upload/vod/20250427-1/ba01d82e006a7d9c2fb3aca49a0a8b1e.jpg",
    backdrop: "https://phimimg.com/upload/vod/20240302-1/495167573eb3f65d09652933e64327c0.jpg",
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
      { name: "Tập 1", slug: "tap-01", source: "https://v7.kkphimplayer7.com/20260729/a8XUKTef/index.m3u8" }
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
      { name: "Full FHD", slug: "full", source: "https://v7.kkphimplayer7.com/20260729/a8XUKTef/index.m3u8" }
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
      { name: "Full FHD", slug: "full", source: "https://v7.kkphimplayer7.com/20260729/a8XUKTef/index.m3u8" }
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
      { name: "Full FHD", slug: "full", source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8" }
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
      { name: "Tập 1", slug: "tap-01", source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8" },
      { name: "Tập 2", slug: "tap-02", source: "https://a.kvp726.com/20261011/cSOFRRA3/index.m3u8" },
      { name: "Tập 3", slug: "tap-03", source: "https://v7.kkphimplayer7.com/20260729/a8XUKTef/index.m3u8" },
      { name: "Tập 4", slug: "tap-04", source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8" }
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
      { name: "Tập 1", slug: "tap-01", source: "https://a.kvp726.com/20261011/cSOFRRA3/index.m3u8" },
      { name: "Tập 2", slug: "tap-02", source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8" }
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
      { name: "Tập 1", slug: "tap-01", source: "https://a.kvp726.com/20261011/cSOFRRA3/index.m3u8" }
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
      { name: "Tập 1", slug: "tap-01", source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8" }
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
      { name: "Full FHD", slug: "full", source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8" }
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
      { name: "Full FHD", slug: "full", source: "https://a.kvp726.com/20261011/cSOFRRA3/index.m3u8" }
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
      { name: "Tập 1", slug: "tap-01", source: "https://a.kvp726.com/20261011/cSOFRRA3/index.m3u8" }
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
      { name: "Tập 1", slug: "tap-01", source: "https://a.kvp726.com/20261011/cSOFRRA3/index.m3u8" }
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
      { name: "Full FHD", slug: "full", source: "https://v7.kkphimplayer7.com/20260729/a8XUKTef/index.m3u8" }
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
      { name: "Tập 1", slug: "tap-01", source: "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8" }
    ]
  }
];

/**
 * PHIMMOI LIVE DATA SERVICE
 * Kết nối trực tiếp tới https://phimmoiz.one/wp-json/wp/v2/posts?_embed
 * và https://phimapi.com/phim/<slug> (nguồn HLS thực tế của phimmoiz.one)
 */
class PhimmoiService {
  constructor() {
    const streamPool = [
      "https://v7.kkphimplayer7.com/20260729/a8XUKTef/index.m3u8",
      "https://a.kvp726.com/20261011/XdpIV8L5/index.m3u8",
      "https://a.kvp726.com/20261011/cSOFRRA3/index.m3u8"
    ];

    this.movies = PHIMMOI_SEED_MOVIES.map((m) => {
      const isStreamOwner =
        m.slug === "thanh-guom-diet-quy-vo-han-thanh-465645" ||
        m.slug === "matchbox-phim-dien-anh" ||
        m.slug === "9-1-1-phan-9";
      if (!isStreamOwner && Array.isArray(m.episodes)) {
        m.episodes = m.episodes.map((ep) => {
          if (streamPool.includes(ep.source)) {
            return { ...ep, source: "", needsEnrich: true };
          }
          return ep;
        });
      }
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
      const cKey = this.getCanonicalMovieKey(m);
      if (cKey) this.canonicalKeyMap.set(cKey, m);
    });

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
      for (let i = 0; i < this.movies.length; i++) {
        const m = this.movies[i];
        if (!m._titleNorm) m._titleNorm = this.normalizeSearchText(m.title);
        if (!m._originNorm) m._originNorm = this.normalizeSearchText(m.originTitle);
      }
    };
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(warmSearchIndex, { timeout: 1500 });
    } else {
      setTimeout(warmSearchIndex, 400);
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
      const is4k = Boolean(
        (item.quality && item.quality.toString().toUpperCase() === "4K") &&
        (Array.isArray(item.sectionTags) && item.sectionTags.includes("4k"))
      );
      const normalizedItem = {
        ...item,
        id: item.id || item.slug,
        crawlSlug: item.crawlSlug || item.slug,
        originTitle: item.originTitle || item.title,
        backdrop: item.backdrop || item.poster,
        quality: is4k ? "4K" : "1080",
        language: item.language || "Vietsub",
        director: item.director || "Đang cập nhật",
        matchScore: item.matchScore || 96,
        ambientColors: item.ambientColors || ["#ffffff", "#d4d4d4", "#a3a3a3"],
        genres: Array.isArray(item.genres) ? item.genres : [item.genres || "Chính Kịch"],
        cast: Array.isArray(item.cast) ? item.cast : [item.cast || "Dàn diễn viên chính"],
        sectionTags: Array.isArray(item.sectionTags) ? item.sectionTags : ["hot", "vietsub"],
        episodes: Array.isArray(item.episodes)
          ? item.episodes
          : [item.episodes || { name: "Tập 1 (Vietsub)", slug: "tap-1", source: "", needsEnrich: true }]
      };

      if (Array.isArray(normalizedItem.episodes)) {
        for (let ei = 0; ei < normalizedItem.episodes.length; ei++) {
          const ep = normalizedItem.episodes[ei];
          if (!ep.slug) ep.slug = `tap-${ei + 1}`;
          if ((!ep.source && !ep.embed) || (ep.source && (ep.source.includes("opstream") || ep.source.includes("vip.opstream")))) {
            ep.needsEnrich = true;
          }
        }
      }

      const existingBySlug =
        this.slugMap.get(normalizedItem.slug) ||
        (normalizedItem.crawlSlug && this.slugMap.get(normalizedItem.crawlSlug));
      let existing = existingBySlug;
      let cKey = "";
      if (!existing && seedKeyCount > 0) {
        cKey = this.getCanonicalMovieKey(normalizedItem);
        existing = cKey && this.canonicalKeyMap.get(cKey);
      }

      if (existing) {
        this.mergeBestQualityMovie(existing, normalizedItem);
        this.slugMap.set(normalizedItem.slug, existing);
        if (normalizedItem.crawlSlug) this.slugMap.set(normalizedItem.crawlSlug, existing);
        if (Array.isArray(normalizedItem.aliasSlugs)) {
          normalizedItem.aliasSlugs.forEach((a) => this.slugMap.set(a, existing));
        }
        if (cKey) this.canonicalKeyMap.set(cKey, existing);
      } else {
        this.movies.push(normalizedItem);
        this.slugMap.set(normalizedItem.slug, normalizedItem);
        if (normalizedItem.crawlSlug) this.slugMap.set(normalizedItem.crawlSlug, normalizedItem);
        if (Array.isArray(normalizedItem.aliasSlugs)) {
          normalizedItem.aliasSlugs.forEach((a) => this.slugMap.set(a, normalizedItem));
        }
      }
    }

    for (let i = 0; i < this.movies.length; i++) {
      const m = this.movies[i];
      m._titleLower = (m.title || "").toLowerCase();
      m._originLower = (m.originTitle || "").toLowerCase();
    }

    this.lastSyncedCount = this.movies.length;

    const warmSearchIndex = () => {
      for (let i = 0; i < this.movies.length; i++) {
        const m = this.movies[i];
        if (!m._titleNorm) m._titleNorm = this.normalizeSearchText(m.title);
        if (!m._originNorm) m._originNorm = this.normalizeSearchText(m.originTitle);
      }
    };
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(warmSearchIndex, { timeout: 1500 });
    } else {
      setTimeout(warmSearchIndex, 400);
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
   * Chuẩn hóa khóa nhận diện phim để phát hiện chính xác các phim trùng lặp (kể cả khác hậu tố tên hoặc slug)
   */
  getCanonicalMovieKey(movie) {
    if (!movie || !movie.title) return "";
    let t = (movie.title || "")
      .toLowerCase()
      .replace(/đ/g, "d")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    t = t.replace(/\s*\((?!phan\s*\d|mua\s*\d|season\s*\d|part\s*\d|ban\s+|19\d\d|20\d\d)[^)]+\)/g, "");
    t = t.replace(/\(phan\s*\d+\)\s*\(([^)]+)\)/g, "$1");
    t = t.replace(/\b(?:phan|mua|season)\s*(\d+)\b/g, "s$1");
    t = t.replace(/\b(\d+)(?:st|nd|rd|th)\s*season\b/g, "s$1");
    t = t.replace(/\s+iii\b/g, " s3");
    t = t.replace(/\s+ii\b/g, " s2");
    t = t.replace(/\s+(\d+)$/g, " s$1");
    t = t.replace(/[^a-z0-9]+/g, " ").trim();
    if (movie.type === "single" && movie.year && Number(movie.year) < 2022) {
      t = `${t} ${movie.year}`;
    }
    return t;
  }

  /**
   * Chấm điểm chất lượng của một bản phim (ưu tiên luồng .m3u8 thật, 4K/1080p, số tập đầy đủ, Thuyết Minh/Lồng Tiếng, ảnh 16:9)
   */
  scoreMovieQuality(m) {
    if (!m) return -999;
    let score = 0;
    const eps = Array.isArray(m.episodes) ? m.episodes : [];
    const validM3u8Eps = eps.filter(
      (e) => e && e.source && (e.source.includes(".m3u8") || e.source.includes("/hls/")) && !e.source.includes("opstream")
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
    const existingValidEps = (existing.episodes || []).filter(
      (e) => e && e.source && (e.source.includes(".m3u8") || e.source.includes("/hls/")) && !e.source.includes("opstream")
    );
    const candidateValidEps = (candidate.episodes || []).filter(
      (e) => e && e.source && (e.source.includes(".m3u8") || e.source.includes("/hls/")) && !e.source.includes("opstream")
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
    if (candidate.quality === "4K" && Array.isArray(candidate.sectionTags) && candidate.sectionTags.includes("4k")) {
      existing.quality = "4K";
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
      .replace(/bộ\s+phim\s+này\s+do[^\n.]*/gi, "")
      .replace(/sản\s+phẩm:\s*(nổ\s*hũ|bắn\s*cá|sòng\s*bài|thể\s*thao|tài\s*xỉu)[^\n.]*/gi, "")
      .replace(/rút\s+tiền\s+24\/7[^\n.]*/gi, "")
      .replace(/nhận\s+tiền\s+trong\s+tích\s+tắc[^\n.]*/gi, "")
      .replace(/tài\s+trợ\s+và\s+công\s+bố[^\n.]*/gi, "")
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
      director,
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
    const isDirectCorsApi = url.includes("phimapi.com") || url.includes("nguonc.com");
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
   * Đồng bộ xu hướng phim thời gian thực (Real-time Trending) từ PhimAPI v3 & NguonC
   */
  async syncLatestFromPhimmoi(perPage = 24) {
    const [phimApiV3Page1, nguoncLatestPage1] = await Promise.all([
      this.smartFetchJson(`${PHIMMOI_CONFIG.phimApiLatest}?page=1`, 2800, true).catch(() => null),
      this.smartFetchJson(`${PHIMMOI_CONFIG.nguoncApiLatest}?page=1`, 2800, true).catch(() => null)
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

      const cKey = this.getCanonicalMovieKey(candidate);
      const existing =
        this.slugMap.get(candidate.slug) ||
        (candidate.crawlSlug && this.slugMap.get(candidate.crawlSlug)) ||
        (cKey && this.canonicalKeyMap.get(cKey));

      if (existing) {
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
        registerTrendingMovie(existing, rankIdx, updatedAtMs);
      } else {
        candidate._titleLower = (candidate.title || "").toLowerCase();
        candidate._originLower = (candidate.originTitle || "").toLowerCase();
        newlyAdded.push(candidate);
        this.slugMap.set(candidate.slug, candidate);
        if (candidate.crawlSlug) this.slugMap.set(candidate.crawlSlug, candidate);
        if (cKey) this.canonicalKeyMap.set(cKey, candidate);
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
          director: nc.director || "Đang cập nhật",
          cast: nc.casts ? nc.casts.split(/,\s*/).slice(0, 6) : ["Dàn diễn viên chính"],
          ambientColors: ["#ffffff", "#d4d4d4", "#a3a3a3"],
          trailerUrl: "",
          synopsis: this.cleanAdText(nc.description || "").slice(0, 220) || `${nc.name} chất lượng cao Vietsub.`,
          episodes: [{ name: nc.current_episode || "Tập 1", slug: "tap-1", source: "", needsEnrich: true }]
        };
        upsertLiveCandidate(candidate, idx + 5, updatedAtMs);
      });
    }

    // 3. Nguồn WP API bổ sung
    if (Array.isArray(wpPage1)) {
      wpPage1.forEach((post, idx) => {
        const normalized = this.normalizeWpPost(post);
        if (normalized) {
          upsertLiveCandidate(normalized, idx + 15, Date.now() - idx * 60000);
        }
      });
    }

    if (newlyAdded.length > 0) {
      this.movies = [...newlyAdded, ...this.movies];
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
   * Tìm kiếm phim đa nguồn: Kho 1470+ phim + Netflix/PhimAPI Vietsub + NguonC Vietsub + WP API
   */
  async searchMovies(query) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return this.movies;
    const qNorm = this.normalizeSearchText(q);
    const qTokens = qNorm ? qNorm.split(" ").filter(Boolean) : [];

    // 1. Tìm tức thì trong kho dữ liệu đã nạp (hỗ trợ cả có dấu, không dấu, và bỏ qua dấu hai chấm / gạch ngang)
    const localMatches = this.movies.filter((m) => {
      const tNorm = m._titleNorm || (m._titleNorm = this.normalizeSearchText(m.title));
      const oNorm = m._originNorm || (m._originNorm = this.normalizeSearchText(m.originTitle));
      const combinedNorm = `${tNorm} ${oNorm}`;
      return (
        m.title.toLowerCase().includes(q) ||
        m.originTitle.toLowerCase().includes(q) ||
        (qNorm && (tNorm.includes(qNorm) || oNorm.includes(qNorm))) ||
        (qTokens.length > 1 && qTokens.every((tk) => combinedNorm.includes(tk))) ||
        m.genres.some((g) => g.toLowerCase().includes(q)) ||
        m.country.toLowerCase().includes(q) ||
        m.cast.some((c) => c.toLowerCase().includes(q)) ||
        m.director.toLowerCase().includes(q)
      );
    });

    // 2. Gọi song song API Vietsub & Netflix trực tuyến (Ưu tiên PhimAPI phản hồi siêu tốc ~200ms)
    const encodedQ = encodeURIComponent(query.trim());
    const [phimApiRes, nguoncRes] = await Promise.all([
      this.smartFetchJson(`${PHIMMOI_CONFIG.phimApiSearch}?keyword=${encodedQ}&limit=12`, 2500).catch(() => null),
      this.smartFetchJson(`${PHIMMOI_CONFIG.nguoncApiSearch}?keyword=${encodedQ}`, 2000).catch(() => null)
    ]);
    const remotePosts = [];

    // Nguồn 1: PhimAPI (Netflix & KKPhim Vietsub)
    if (phimApiRes && phimApiRes.data && Array.isArray(phimApiRes.data.items)) {
      phimApiRes.data.items.forEach((item) => {
        if (!item || !item.slug || this.slugMap.has(item.slug) || this.isAdOrSpam(item)) return;
        const posterUrl = item.poster_url?.startsWith("http") ? item.poster_url : `https://phimimg.com/${item.poster_url}`;
        const thumbUrl = item.thumb_url?.startsWith("http") ? item.thumb_url : `https://phimimg.com/${item.thumb_url}`;
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
          director: "Netflix / Vietsub",
          cast: ["Dàn diễn viên chính"],
          ambientColors: ["#ffffff", "#d4d4d4", "#a3a3a3"],
          trailerUrl: "",
          link: "",
          synopsis: `${item.name} (${item.origin_name}) bản Full HD 1080p ${item.lang || "Vietsub"} trên Ngwyren Cinema.`,
          episodes: [{ name: "Tập 1 (Vietsub)", slug: "tap-1", source: "", embed: "", needsEnrich: true }]
        };
        const cKey = this.getCanonicalMovieKey(newMovie);
        const existingDup = cKey && this.canonicalKeyMap.get(cKey);
        if (existingDup) {
          this.mergeBestQualityMovie(existingDup, newMovie);
          this.slugMap.set(newMovie.slug, existingDup);
          if (!localMatches.includes(existingDup)) localMatches.push(existingDup);
          return;
        }
        this.movies.unshift(newMovie);
        this.slugMap.set(newMovie.slug, newMovie);
        if (cKey) this.canonicalKeyMap.set(cKey, newMovie);
        localMatches.push(newMovie);
      });
    }

    // Nguồn 2: NguonC Vietsub CDN
    if (nguoncRes && Array.isArray(nguoncRes.items)) {
      nguoncRes.items.forEach((nc) => {
        if (!nc || !nc.slug || this.slugMap.has(nc.slug) || this.isAdOrSpam(nc)) return;
        const isSer = parseInt(nc.total_episodes, 10) > 1;
        const newMovie = {
          id: `nc-${nc.slug}`,
          slug: nc.slug,
          crawlSlug: nc.slug,
          title: nc.name,
          originTitle: nc.original_name || nc.name,
          poster: nc.thumb_url || nc.poster_url,
          backdrop: nc.poster_url || nc.thumb_url,
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
          director: nc.director || "Đang cập nhật",
          cast: nc.casts ? nc.casts.split(/,\s*/) : ["Dàn diễn viên chính"],
          ambientColors: ["#ffffff", "#d4d4d4", "#a3a3a3"],
          trailerUrl: "",
          link: "",
          synopsis: this.cleanAdText(nc.description) || `${nc.name} chất lượng cao Vietsub.`,
          episodes: [{ name: "Tập 1 (Vietsub)", slug: "tap-1", source: "", embed: "", needsEnrich: true }]
        };
        const cKey = this.getCanonicalMovieKey(newMovie);
        const existingDup = cKey && this.canonicalKeyMap.get(cKey);
        if (existingDup) {
          this.mergeBestQualityMovie(existingDup, newMovie);
          this.slugMap.set(newMovie.slug, existingDup);
          if (!localMatches.includes(existingDup)) localMatches.push(existingDup);
          return;
        }
        this.movies.unshift(newMovie);
        this.slugMap.set(newMovie.slug, newMovie);
        if (cKey) this.canonicalKeyMap.set(cKey, newMovie);
        localMatches.push(newMovie);
      });
    }

    // Nguồn 3: WP API
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
    return scored.map((it) => it.movie);
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

    let [phimApiRes, nguoncRes] = await Promise.all([
      this.smartFetchJson(`${PHIMMOI_CONFIG.phimApiBase}${encodeURIComponent(slugToTry)}`, 2800),
      this.smartFetchJson(`${PHIMMOI_CONFIG.nguoncApiBase}${encodeURIComponent(slugToTry)}`, 2400)
    ]);
    const wpPosts = null;

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
          else if (cleanTarget && cleanTarget.length >= 3 && itName.includes(cleanTarget)) score += 25;
          if (originTarget && itOrigin === originTarget) score += 60;
          else if (originTarget && originTarget.length >= 3 && itOrigin.includes(originTarget)) score += 20;

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

        if (bestHit && highestScore > 0 && bestHit.slug) {
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
          else if (cleanTarget && cleanTarget.length >= 3 && itName.includes(cleanTarget)) score += 25;
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

        if (bestNc && highestNcScore > 0 && bestNc.slug) {
          nguoncRes = await this.smartFetchJson(`${PHIMMOI_CONFIG.nguoncApiBase}${encodeURIComponent(bestNc.slug)}`, 4500);
        }
      }
    }

    // 1. Nguồn PhimAPI (Netflix / KKPhim Vietsub #1 + Lồng Tiếng / Thuyết Minh + Các luồng Server phụ)
    if (phimApiRes && Array.isArray(phimApiRes.episodes) && phimApiRes.episodes.length > 0) {
      const resYear = parseInt(phimApiRes.movie?.year, 10);
      const movYear = parseInt(movie.year, 10);
      const isYearCompatible = isNaN(resYear) || isNaN(movYear) || Math.abs(resYear - movYear) <= 1;

      if (isYearCompatible) {
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
            // Chuẩn hóa trung thực: Tất cả luồng phim từ máy chủ API hiện tại đều là Full HD 1080p
            // Tuyệt đối không gắn nhãn 4K ảo nếu luồng thực tế là 1080p
            movie.quality = "1080";
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

      if (isNcYearCompatible) {
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
          // Nếu nguồn chính chỉ có 1 tập mẫu mà NguonC có nhiều tập hơn thì cập nhật luôn
          if (movie.nguoncEpisodes.length > (movie.episodes ? movie.episodes.length : 0)) {
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

    // 3. Nguồn WP API bổ sung
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
          ep.embed = `https://player.phimapi.com/player/?url=${encodeURIComponent(realSource)}`;
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

  stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html || "";
    return (tmp.textContent || tmp.innerText || "").replace(/\s+/g, " ").trim();
  }

  decodeEntities(str) {
    const txt = document.createElement("textarea");
    txt.innerHTML = str || "";
    return txt.value;
  }
}

// Khởi tạo instance toàn cục
window.phimmoiService = new PhimmoiService();
