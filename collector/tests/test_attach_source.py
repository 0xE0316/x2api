from __future__ import annotations

import json
import unittest
from base64 import b64encode
from datetime import datetime, timezone
from unittest.mock import patch

from Crypto.Cipher import AES

from collector import attach_source as attach


class AttachSourceTests(unittest.TestCase):
    def test_parse_list_page_skips_sponsored_cards_and_extracts_real_articles(self):
        html = """
        <html><body>
          <article class="no-mask">
            <a href="/archives/100/" rel="sponsored nofollow">
              <div class="post-card"><div class="post-card-mask post-card-ads"></div></div>
            </a>
          </article>
          <article>
            <a href="/archives/188412/">
              <div class="post-card" id="post-card-188412">
                <script>loadBannerDirect('https://pic.example.test/cover.jpeg', '', document.querySelector('#post-card-188412'), '-1', 1, 1);</script>
                <h2 class="post-card-title">Real Title</h2>
                <div class="post-card-info">
                  <span>作者 •</span>
                  <span content="2026-06-10T02:30:00+00:00" itemprop="datePublished">date •</span>
                  <span>今日大瓜, 福利视频</span>
                </div>
              </div>
            </a>
          </article>
        </body></html>
        """

        with patch.object(attach, "fetch_html", return_value=html):
            items = attach.parse_list_page("https://attach.bslqmdvk.cc/category/zxcg/", 1)

        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["guid"], "attach:188412")
        self.assertEqual(items[0]["url"], "https://attach.bslqmdvk.cc/archives/188412/")
        self.assertEqual(items[0]["title"], "Real Title")
        self.assertEqual(items[0]["image"], "https://pic.example.test/cover.jpeg")
        self.assertEqual(items[0]["published_at"], datetime(2026, 6, 10, 2, 30, tzinfo=timezone.utc))
        self.assertEqual(items[0]["tags"], ["今日大瓜", "福利视频"])

    def test_parse_detail_page_uses_video_url_and_ignores_ad_urls(self):
        config = {
            "video_ads_url": "https://hls.chxgdn.cn/videos5/ad/ad.m3u8?auth_key=1781061721-1-0-ad",
            "backend_video_ads_url": "https://hls.chxgdn.cn/videos5/ad/backend.m3u8?auth_key=1781061721-1-0-ad",
            "video": {
                "url": "https://hls.chxgdn.cn/videos5/real/real.m3u8?auth_key=1781061721-1-0-real",
                "type": "hls",
            },
        }
        html = f"""
        <html>
          <head>
            <script type="application/ld+json">
              {{"@type":"Article","headline":"Detail Title","datePublished":"2026-06-10T02:30:00+00:00","keywords":["tag-a"]}}
            </script>
          </head>
          <body>
            <h1>Fallback</h1>
            <div class="dplayer" data-config='{json.dumps(config)}'></div>
          </body>
        </html>
        """

        with patch.object(attach, "fetch_html", return_value=html):
            detail = attach.parse_detail_page("https://attach.bslqmdvk.cc/archives/188412/")

        self.assertEqual(detail["title"], "Detail Title")
        self.assertEqual(len(detail["players"]), 1)
        self.assertEqual(detail["players"][0]["guid"], "attach:188412:188412001")
        self.assertEqual(detail["players"][0]["video_url"], "https://hls.chxgdn.cn/videos5/real/real.m3u8?auth_key=1781061721-1-0-real")
        self.assertEqual(detail["players"][0]["video_type"], "hls")
        self.assertEqual(detail["players"][0]["tags"], [])

    def test_parse_detail_page_resolves_packed_player_script(self):
        config = {
            "video": {
                "url": "https://hls.chxgdn.cn/videos5/real/real.m3u8?auth_key=1781061721-1-0-real",
                "type": "hls",
            },
            "notice": "x" * 100,
        }
        encoded = b64encode(json.dumps(config).encode()).decode()
        token = "a" * 80
        player_key = "03bfb0be"
        html = f"""
        <html><body>
          <h1>Detail Title</h1>
          <div id="player-box-{player_key}"></div>
          <script>
            eval(function(p,a,c,k,e,d){{return p}}('x /3/d/4/',27,27,'document|player-box-{player_key}|{player_key}|{token}'.split('|'),0,{{}}))
          </script>
        </body></html>
        """

        class FakeResponse:
            content = f"eval(function(){{return '{encoded}'}})".encode()
            encoding = "utf-8"

        with (
            patch.object(attach, "fetch_html", return_value=html),
            patch.object(attach, "player_script_slot_candidates", return_value=[123]),
            patch.object(attach, "request_with_proxy_fallback", return_value=FakeResponse()),
        ):
            detail = attach.parse_detail_page("https://attach.bslqmdvk.cc/archives/188412/")

        self.assertEqual(len(detail["players"]), 1)
        self.assertEqual(detail["players"][0]["guid"], f"attach:188412:{player_key}")
        self.assertEqual(detail["players"][0]["video_url"], config["video"]["url"])
        self.assertEqual(detail["players"][0]["player_key"], player_key)

    def test_verify_hls_url_accepts_encrypted_segments_after_decrypting_probe(self):
        key = b"0123456789abcdef"
        iv = bytes.fromhex("762d6e9771693490b6ba7dd8960d9631")
        plaintext = bytearray(188 * 4)
        plaintext[0] = 0x47
        plaintext[188] = 0x47
        encrypted = AES.new(key, AES.MODE_CBC, iv).encrypt(bytes(plaintext))
        playlist = """#EXTM3U
#EXT-X-VERSION:3
#EXT-X-KEY:METHOD=AES-128,URI="https://dx.oviluf.cn/videos5/real/crypt.key?auth_key=1781061746-1-0-key",IV=0x762d6e9771693490b6ba7dd8960d9631
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-TARGETDURATION:5
#EXTINF:5.0,
https://dx.oviluf.cn/videos5/real/seg0.ts?auth_key=1781061746-1-0-seg
#EXT-X-ENDLIST
"""

        def fake_read_media_chunk(url, referer, size):
            if "crypt.key" in url:
                return key, object()
            return encrypted[:size], object()

        with patch.object(attach, "fetch_hls_text", return_value=playlist), patch.object(attach, "read_media_chunk", side_effect=fake_read_media_chunk):
            with patch.object(attach, "now_utc", return_value=datetime(2026, 6, 10, 3, 0, tzinfo=timezone.utc)):
                verified = attach.verify_hls_url("https://hls.chxgdn.cn/videos5/real/real.m3u8?auth_key=1781061721-1-0-real", "https://attach.bslqmdvk.cc/archives/188412/")

        self.assertEqual(verified["media_format"], "hls")
        self.assertTrue(verified["encrypted"])
        self.assertFalse(verified["playback_refresh_required"])
        self.assertEqual(verified["playback_headers"]["Referer"], "https://attach.bslqmdvk.cc/archives/188412/")

    def test_reject_ad_url_rejects_known_ad_hosts(self):
        with self.assertRaisesRegex(ValueError, "ad host"):
            attach.reject_ad_url("https://a.adtng.com/video.m3u8")

    def test_parse_query_expiry_uses_explicit_expiry_key(self):
        self.assertEqual(
            attach.parse_query_expiry("https://hls.chxgdn.cn/video.m3u8?expires=1781061721"),
            datetime(2026, 6, 10, 3, 22, 1, tzinfo=timezone.utc),
        )

    def test_parse_query_expiry_ignores_attach_auth_key_timestamp(self):
        self.assertIsNone(attach.parse_query_expiry("https://hls.chxgdn.cn/video.m3u8?auth_key=1781061721-1-0-real"))


if __name__ == "__main__":
    unittest.main()
