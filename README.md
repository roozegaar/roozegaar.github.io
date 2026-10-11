# Roozegaar Projects Collection

<details>
<summary>🇮🇷 فارسی</summary>

## توضیحات کلی
این مجموعه شامل چندین پروژه کاربردی و با کیفیت است که توسط **مهدی دیمیادی** توسعه داده شده‌اند.  
تمام پروژه‌ها با تمرکز بر **تجربه کاربری عالی، امنیت، همگام‌سازی، و ظاهر قابل شخصی‌سازی** ساخته شده‌اند.

## ویژگی‌ها
- امنیت بالا و محافظت کامل از داده‌ها  
- همگام‌سازی آسان بین دستگاه‌ها  
- قالب‌ها و تم‌ها برای شخصی‌سازی ظاهر پروژه  
- عملکرد و سرعت بهینه  
- قابلیت شخصی‌سازی گسترده  

## فایل‌ها
- HTML, CSS, JS برای وب  
- JSON برای داده‌ها و ترجمه‌ها

## نصب و اجرا
1. فایل‌ها را دانلود کنید یا از گیت‌هاب کلون بگیرید.  
2. با مرورگر وب فایل `index.html` را باز کنید یا از سرور محلی استفاده کنید.  
3. زبان و تم برنامه قابل تغییر هستند و تنظیمات ذخیره می‌شوند.

## تشکر
تشکر ویژه از توسعه‌دهندگان برنامه **Brackets** در ویندوز و **Acode** در اندروید برای کمک به توسعه و ویرایش این پروژه دارم.

## وب‌سایت

- [www.roozegaar.ir](https://www.roozegaar.ir)
- <a href="https://roozegaar.github.io" target="_blank">roozegaar.github.io</a>

</details>

<details>
<summary>🇬🇧 English</summary>

## Overview
This collection contains multiple practical and high-quality projects developed by **Mehdi Dimyadi**.  
All projects are built with a focus on **excellent user experience, security, synchronization, and customizable UI**.

## Features
- High security and full data protection  
- Easy synchronization across devices  
- Themes & templates for customizing project appearance  
- Optimized performance and speed  
- Extensive customizability  

## Files
- HTML, CSS, JS for web  
- JSON for data and translations

## Installation & Usage
1. Download the files or clone from GitHub.  
2. Open `index.html` in a web browser or use a local server.  
3. Language and theme settings are configurable and saved.

## Thanks
Special thanks to the developers of **Brackets** on Windows and **Acode** on Android for assisting in developing and editing this project.

## Website
- [www.roozegaar.ir](https://www.roozegaar.ir)
- <a href="https://roozegaar.github.io" target="_blank">roozegaar.github.io</a>

</details>


## Adding a project (content data)

Projects live in `data/projects.json` and are shown on the home page as a timeline,
newest first. Every entry needs:

| Field | Meaning |
| --- | --- |
| `id` | Slug; matches the page file name and `page/<id>.json` |
| `date` | Publish date, `YYYY-MM-DD` (a time like `2026-06-27T18:30:00Z` is also accepted) |
| `icon` | Font Awesome classes used for the timeline node and hero |
| `publish` | Set to `"false"` to hide the entry |

Dates are stored in the Gregorian calendar. The Persian view is produced by the
browser (`Intl.DateTimeFormat` with the `persian` calendar), so no converter code is needed.
Entries sharing the same date keep their order in the file.
