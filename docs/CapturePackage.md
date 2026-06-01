# مستند هسته‌ای CapturePackage

این سند یکی از مهم‌ترین سندهای طراحی سیستم WorkGraph AI است. هدف آن تعریف دقیق داده‌ای است که کلاینت ویندوز از محیط کاربر تولید می‌کند و به سرور می‌فرستد.

در این محصول، واحد اصلی داده فقط «اسکرین‌شات» نیست. واحد اصلی باید **CapturePackage** باشد.

```text
CapturePackage = Screenshot + Window Data + Activity Logs + Device Data + Session Data + Upload Logs + Client Audit
```

## تعریف ساده

CapturePackage یک بسته داده‌ای است که در هر چرخه Capture توسط Windows Agent ساخته می‌شود. این بسته می‌تواند شامل تصویر صفحه، متادیتای تصویر، اطلاعات پنجره فعال، وضعیت فعالیت کاربر، وضعیت دستگاه، وضعیت Session، لاگ آپلود و لاگ‌های داخلی Agent باشد.

هدف CapturePackage این است که سرور بتواند بدون حدس زیاد بفهمد:

- چه کسی کار می‌کرد؟
- روی چه دستگاهی؟
- در چه Session و Tenant؟
- در چه زمانی؟
- چه تصویری از دسکتاپ ثبت شده؟
- کدام برنامه یا پنجره فعال بوده؟
- کاربر فعال بوده یا Idle؟
- ارسال موفق بوده یا نیاز به Retry داشته؟
- چه داده‌ای باید توسط AI تحلیل شود؟
- چه داده‌ای فقط برای Audit، Debug و Compliance لازم است؟

---

## دو خانواده اصلی داده

در سیستم ما داده خام کلاینت به دو خانواده اصلی تقسیم می‌شود:

| خانواده داده | توضیح فارسی | مثال |
|---|---|---|
| داده تصویری / Screenshot Data | داده‌هایی که از خود اسکرین‌شات یا پردازش تصویر به دست می‌آیند. خود تصویر خام، Thumbnail، Hash و بعداً خروجی AI Vision در این گروه قرار می‌گیرند. | screenshot.webp, thumbnail.webp, OCR text, work category |
| داده ویندوز / Window & Log Data | داده‌هایی که Agent مستقیماً از Windows API، وضعیت سیستم، Session، لاگ‌ها و Queue محلی جمع‌آوری می‌کند. | processName, windowTitle, idleSeconds, agentVersion, uploadStatus |

نکته مهم: بعضی داده‌ها مثل `WorkCategory` یا `AISummary` توسط کلاینت تولید نمی‌شوند. این‌ها بعد از آپلود، در سرور یا AI Worker تولید می‌شوند؛ اما چون به CapturePackage وابسته هستند، در همین مدل مستندسازی می‌شوند.

---

## جدول کامل آیتم‌های CapturePackage

| گروه | نام فیلد | نوع داده پیشنهادی | منبع تولید | نمونه مقدار | توضیح فارسی | ارسال به سرور | ذخیره Raw | اولویت |
|---|---|---|---|---|---|---|---|---|
| Identity | tenantId | string | Agent config / server-issued | `tenant_01` | شناسه Tenant یا سازمان مشتری. برای جداسازی کامل داده‌های مشتریان لازم است. | بله | بله | MVP |
| Identity | employeeId | string | Server-issued | `emp_44` | شناسه کارمند در سیستم. تمام Captureها باید به یک کارمند متصل باشند. | بله | بله | MVP |
| Identity | deviceId | string | Agent registration | `dev_88` | شناسه یکتای دستگاه نصب‌شده. برای امنیت، Binding و Audit لازم است. | بله | بله | MVP |
| Identity | sessionId | string | Server-issued | `sess_99` | شناسه Session مانیتورینگ. Capture فقط باید در Session فعال انجام شود. | بله | بله | MVP |
| Identity | captureId | string | Agent generated | `cap_01HX...` | شناسه یکتای هر CapturePackage. برای Idempotency، Retry، Trace و Duplicate Detection مهم است. | بله | بله | MVP |
| Identity | correlationId | string | Agent / server | `corr_abc123` | شناسه Trace برای دنبال کردن یک Capture از کلاینت تا Queue، AI و Dashboard. | بله | بله | V1 |
| Screenshot File | imageFile | binary/file | Desktop capture | `cap_123.webp` | فایل تصویر اصلی از دسکتاپ. مهم‌ترین منبع برای AI Vision است. | بله | بله، با Retention | MVP |
| Screenshot File | thumbnailFile | binary/file | Agent/server processing | `cap_123_thumb.webp` | نسخه کوچک تصویر برای نمایش سریع در Dashboard. | بله | بله | MVP |
| Screenshot Metadata | capturedAtUtc | datetime | Agent clock | `2026-06-01T10:25:30Z` | زمان ثبت تصویر بر اساس UTC. برای Timeline و مرتب‌سازی لازم است. | بله | بله | MVP |
| Screenshot Metadata | localCapturedAt | datetime | Agent local clock | `2026-06-01T14:25:30+04:00` | زمان محلی دستگاه. برای نمایش قابل فهم به مدیر یا کارمند مفید است. | بله | بله | V1 |
| Screenshot Metadata | imageFormat | string/enum | Agent processing | `webp` | فرمت تصویر ارسالی. مثل webp، jpeg یا png. | بله | بله | MVP |
| Screenshot Metadata | width | integer | Image metadata | `1920` | عرض تصویر. برای تحلیل، نمایش و محاسبه هزینه مفید است. | بله | بله | MVP |
| Screenshot Metadata | height | integer | Image metadata | `1080` | ارتفاع تصویر. برای تحلیل، نمایش و محاسبه هزینه مفید است. | بله | بله | MVP |
| Screenshot Metadata | fileSizeBytes | integer | Agent processing | `184320` | اندازه فایل بعد از فشرده‌سازی. برای کنترل Upload، Storage و Cost لازم است. | بله | بله | MVP |
| Screenshot Metadata | hashSha256 | string | Agent hashing | `a91f...` | هش تصویر یا Payload برای تشخیص Duplicate و Integrity. | بله | بله | MVP |
| Screenshot Metadata | monitorIndex | integer | Windows display info | `1` | شماره مانیتور ثبت‌شده. برای سیستم‌های چندمانیتوره مهم است. | بله | بله | V1 |
| Screenshot Metadata | monitorCount | integer | Windows display info | `2` | تعداد مانیتورهای فعال. برای فهم محیط کاری کارمند مفید است. | بله | بله | V1 |
| Screenshot Metadata | dpiScale | number | Windows display info | `1.25` | Scale نمایشگر. برای OCR و نمایش دقیق‌تر تصویر کاربرد دارد. | اختیاری | بله | V2 |
| Screenshot Metadata | isMasked | boolean | Agent processing | `false` | مشخص می‌کند تصویر قبل از ارسال Mask یا Blur شده است یا نه. | بله | بله | V1 |
| Screenshot Metadata | maskPolicyId | string | Policy | `mask_policy_default` | شناسه Policy مربوط به Blur/Mask. برای Compliance مهم است. | بله | بله | V1 |
| Screenshot Metadata | compressionQuality | integer | Agent processing | `70` | کیفیت فشرده‌سازی تصویر. روی هزینه و کیفیت AI اثر دارد. | بله | بله | V1 |
| Screenshot Metadata | encryptionMode | string | Agent config | `AES-256-GCM` | نوع رمزنگاری Payload یا فایل محلی. | بله | بله | V1 |
| Screenshot Metadata | payloadSizeBytes | integer | Agent processing | `205000` | اندازه نهایی Payload ارسالی به API. | بله | بله | MVP |
| Window Data | foregroundProcessName | string | Windows API | `devenv.exe` | نام Process فعال. یکی از مهم‌ترین سیگنال‌ها برای تشخیص نوع کار است. | بله | بله | MVP |
| Window Data | foregroundAppName | string | Mapping/rules | `Visual Studio` | نام قابل فهم برنامه برای نمایش در Dashboard. | بله | بله | MVP |
| Window Data | activeWindowTitle | string | Windows API | `OrderService.cs - Randevoo` | عنوان پنجره فعال. بسیار مفید اما حساس؛ باید Redaction/Policy داشته باشد. | بله | بله، با احتیاط | MVP |
| Window Data | executablePath | string | Windows API | `C:\Program Files\...\devenv.exe` | مسیر فایل اجرایی. برای تشخیص دقیق برنامه مفید است ولی ممکن است اطلاعات محلی حساس داشته باشد. | اختیاری | ترجیحاً Hash یا کوتاه‌مدت | V1 |
| Window Data | executableHash | string | Agent hashing | `sha256...` | هش فایل اجرایی برای تشخیص برنامه بدون ذخیره مسیر کامل. | اختیاری | بله | V2 |
| Window Data | processId | integer | Windows API | `8452` | شناسه Process محلی. بیشتر برای Debug کاربرد دارد. | اختیاری | کوتاه‌مدت | V1 |
| Window Data | activeDurationSeconds | integer | Agent timer | `42` | مدت زمان فعال بودن پنجره فعلی. برای Context Switching و Focus مهم است. | بله | بله | MVP |
| Window Data | localAppCategory | string/enum | Local rules | `Development` | دسته‌بندی محلی بر اساس Rule. ارزان‌تر از AI است و می‌تواند قبل از آپلود ساخته شود. | بله | بله | MVP |
| Window Data | browserDomain | string | Browser extension / optional | `github.com` | دامنه مرورگر فعال. بهتر است فقط Domain ذخیره شود نه URL کامل. | اختیاری | بله | V2 |
| Window Data | browserPageTitle | string | Browser extension / window title | `Pull requests - GitHub` | عنوان صفحه مرورگر. حساس است و نیاز به Policy دارد. | اختیاری | با Redaction | V2 |
| Activity Logs | isIdle | boolean | Windows last input time | `false` | مشخص می‌کند کاربر در لحظه Capture idle بوده یا فعال. | بله | بله | MVP |
| Activity Logs | idleSeconds | integer | Windows last input time | `18` | مدت زمان از آخرین Input کاربر. برای تحلیل فعالیت مهم است. | بله | بله | MVP |
| Activity Logs | keyboardEventCount | integer | Agent counter | `24` | تعداد رویدادهای کیبورد در بازه Capture. بهتر است فقط Aggregated ذخیره شود. | اختیاری | Aggregated | V1 |
| Activity Logs | mouseEventCount | integer | Agent counter | `51` | تعداد رویدادهای موس در بازه Capture. بهتر است فقط Aggregated ذخیره شود. | اختیاری | Aggregated | V1 |
| Activity Logs | mouseMoveDistancePx | integer | Agent calculation | `1240` | مسافت حرکت موس. برای تشخیص فعالیت سطحی مفید است. | اختیاری | Aggregated | V2 |
| Activity Logs | screenLocked | boolean | Windows session state | `false` | اگر صفحه Lock باشد، معمولاً نباید Screenshot عادی گرفته شود. | بله | بله | MVP |
| Activity Logs | userSessionState | string/enum | Windows session | `active` | وضعیت Session ویندوز: active، locked، sleep، disconnected. | بله | بله | MVP |
| Activity Logs | agentPaused | boolean | Agent state | `false` | نشان می‌دهد Agent توسط کاربر، مدیر یا Policy متوقف شده یا نه. | بله | بله | MVP |
| Activity Logs | pauseReason | string/enum | Agent/admin/user | `outside_hours` | دلیل Pause یا Skip. برای توضیح نبود داده در Timeline مهم است. | بله | بله | MVP |
| Device Data | machineName | string | Windows | `EMP-LAPTOP-12` | نام دستگاه در شبکه/ویندوز. برای Admin و Troubleshooting مفید است. | بله | بله | MVP |
| Device Data | windowsUsername | string | Windows | `ramin` | نام کاربر ویندوز. ممکن است حساس باشد؛ می‌توان Hash کرد. | اختیاری | با احتیاط | V1 |
| Device Data | osVersion | string | Windows | `Windows 11 Pro 23H2` | نسخه سیستم‌عامل برای پشتیبانی و سازگاری Agent. | بله | بله | MVP |
| Device Data | agentVersion | string | Agent | `1.0.4` | نسخه Agent. برای Debug و Rollout حیاتی است. | بله | بله | MVP |
| Device Data | timezone | string | OS | `Asia/Baku` | Timezone دستگاه برای نمایش محلی Timeline. | بله | بله | MVP |
| Device Data | localIp | string | Network adapter | `192.168.1.10` | IP محلی برای Debug شبکه. | اختیاری | کوتاه‌مدت | V1 |
| Device Data | publicIp | string | Server request | `x.x.x.x` | IP عمومی از سمت سرور قابل ثبت است. برای Security/Audit مفید است. | سمت سرور | کوتاه‌مدت | V1 |
| Device Health | cpuUsagePercent | number | Performance counter | `23.5` | مصرف CPU. برای تشخیص اثر Agent روی سیستم و Debug مفید است. | اختیاری | Aggregated | V1 |
| Device Health | ramUsagePercent | number | Performance counter | `61` | مصرف RAM. برای سلامت دستگاه و Agent. | اختیاری | Aggregated | V1 |
| Device Health | diskFreeBytes | integer | OS | `45000000000` | فضای آزاد دیسک. برای کنترل Local Queue مهم است. | اختیاری | آخرین مقدار | V1 |
| Device Health | networkStatus | string/enum | OS | `online` | وضعیت شبکه. برای Retry و تحلیل تأخیر آپلود مهم است. | بله | بله | MVP |
| Session Data | policyId | string | Server-issued | `policy_default` | Policy فعال برای Capture. شامل Interval، ساعات مجاز، Masking و Retention. | بله | بله | MVP |
| Session Data | captureIntervalSeconds | integer | Policy | `30` | فاصله زمانی Capture. مستقیماً روی هزینه AI و Storage اثر دارد. | بله | بله | MVP |
| Session Data | sessionStartUtc | datetime | Server-issued | `2026-06-01T05:00:00Z` | شروع Session مجاز. | بله | بله | MVP |
| Session Data | sessionEndUtc | datetime | Server-issued | `2026-06-01T13:00:00Z` | پایان Session مجاز. | بله | بله | MVP |
| Session Data | consentStatus | string/enum | Server policy | `approved` | وضعیت Consent یا Approval. برای Compliance بسیار مهم است. | بله | بله | MVP |
| Session Data | captureMode | string/enum | Policy | `screenshot_with_metadata` | نوع Capture فعال. مثلاً فقط metadata یا screenshot + metadata. | بله | بله | V1 |
| Upload Logs | uploadAttemptId | string | Agent | `upl_123` | شناسه هر تلاش آپلود. برای Retry و Trace مفید است. | بله | بله | MVP |
| Upload Logs | uploadStatus | string/enum | Agent/API | `accepted` | وضعیت آپلود: pending، sent، failed، accepted. | بله | بله | MVP |
| Upload Logs | retryCount | integer | Agent | `0` | تعداد تلاش مجدد برای ارسال همین Capture. | بله | بله | MVP |
| Upload Logs | lastErrorCode | string/null | Agent/API | `NETWORK_TIMEOUT` | آخرین خطای آپلود یا API. برای Debug مهم است. | بله | بله | MVP |
| Upload Logs | nextRetryAtUtc | datetime/null | Agent | `2026-06-01T10:26:00Z` | زمان تلاش بعدی بر اساس Backoff. | اختیاری | بله | V1 |
| Upload Logs | httpStatusCode | integer/null | API response | `202` | کد HTTP دریافتی از سرور. | بله | بله | MVP |
| Local Queue | pendingCaptureCount | integer | Agent local DB | `5` | تعداد Captureهای در صف محلی که هنوز ارسال نشده‌اند. | بله | آخرین/تجمیعی | MVP |
| Local Queue | localQueueSizeBytes | integer | Agent local DB | `42000000` | اندازه صف محلی. برای جلوگیری از پر شدن دیسک لازم است. | بله | آخرین/تجمیعی | V1 |
| Local Queue | localEncryptedPath | string | Agent internal | `C:\ProgramData\WorkGraph\queue\cap_123.bin` | مسیر فایل رمزنگاری‌شده محلی. نباید به سرور ارسال شود مگر برای Debug خاص. | خیر | فقط محلی | MVP |
| Client Audit | agentStartedAtUtc | datetime | Agent log | `2026-06-01T08:00:00Z` | زمان Start شدن Agent. برای Reliability مهم است. | بله | بله | MVP |
| Client Audit | agentStoppedAtUtc | datetime/null | Agent log | `null` | زمان Stop شدن Agent. برای تشخیص Gap در داده‌ها. | بله | بله | MVP |
| Client Audit | captureSkippedReason | string/null | Agent log | `OutsideWorkWindow` | دلیل Skip شدن Capture. نبود تصویر همیشه خطا نیست؛ ممکن است Policy باشد. | بله | بله | MVP |
| Client Audit | policyUpdatedAtUtc | datetime/null | Agent log | `2026-06-01T09:10:00Z` | زمان دریافت Policy جدید توسط Agent. | بله | بله | V1 |
| Client Audit | userPausedAtUtc | datetime/null | Agent UI | `null` | زمان Pause توسط کاربر. برای شفافیت و Compliance. | اختیاری | بله | V1 |
| Client Audit | userResumedAtUtc | datetime/null | Agent UI | `null` | زمان Resume توسط کاربر. | اختیاری | بله | V1 |
| Server Result | serverCaptureId | string | Server API | `srv_cap_123` | شناسه ثبت‌شده در سرور. ممکن است با captureId کلاینت متفاوت باشد. | سمت سرور | بله | MVP |
| Server Result | acceptedAtUtc | datetime | Server API | `2026-06-01T10:25:34Z` | زمان پذیرش Capture در سرور. | سمت سرور | بله | MVP |
| Server Result | validationStatus | string/enum | Server API | `accepted` | نتیجه Validation. | سمت سرور | بله | MVP |
| Server Result | validationReason | string/null | Server API | `duplicate_hash` | دلیل رد یا هشدار Validation. | سمت سرور | بله | MVP |
| Storage Result | storageKey | string | Server storage | `tenant/t1/employee/e1/session/s1/cap_123.webp` | مسیر Object Storage برای فایل تصویر. | سمت سرور | بله | MVP |
| Storage Result | storageProvider | string | Server storage | `MinIO` | محل ذخیره‌سازی: MinIO، S3، Azure Blob یا Local encrypted storage. | سمت سرور | بله | V1 |
| Queue Result | analysisJobId | string | Server queue | `job_123` | شناسه Job تحلیل. | سمت سرور | بله | MVP |
| Queue Result | queueName | string | Server queue | `capture-analysis` | نام Queue. | سمت سرور | بله | V1 |
| Queue Result | processingStatus | string/enum | Server/worker | `PendingAnalysis` | وضعیت پردازش: Pending، Processing، Processed، Failed. | سمت سرور | بله | MVP |
| AI Extraction | detectedApplication | string | AI Vision / rules | `Visual Studio` | برنامه‌ای که از تصویر یا ترکیب تصویر و Window Data تشخیص داده شده. | تولید سرور | بله | MVP |
| AI Extraction | detectedToolCategory | string/enum | AI Vision / rules | `IDE` | دسته ابزار قابل مشاهده. | تولید سرور | بله | MVP |
| AI Extraction | visibleDocumentType | string/enum | AI Vision | `code_file` | نوع محتوای قابل مشاهده: کد، اکسل، ایمیل، CRM، Meeting و غیره. | تولید سرور | بله | V1 |
| AI Extraction | ocrTextSnippets | string[] | OCR/AI | `['OrderService','CreateOrder']` | قطعات کوتاه متن استخراج‌شده. باید Redaction و محدودیت ذخیره داشته باشد. | تولید سرور | با احتیاط | V1 |
| AI Extraction | ocrLanguage | string | OCR/AI | `en` | زبان متن قابل مشاهده. | تولید سرور | بله | V1 |
| AI Extraction | workCategory | string/enum | AI/rules | `Development` | دسته کاری نهایی. برای Dashboard و گزارش‌ها مهم است. | تولید سرور | بله | MVP |
| AI Extraction | nonWorkCategory | string/enum/null | AI/rules | `social_media` | اگر فعالیت غیرکاری تشخیص داده شود. باید Human Review داشته باشد. | تولید سرور | بله | V1 |
| AI Extraction | sensitiveContentFlag | string[] | AI/rules | `['personal_chat']` | پرچم محتوای حساس. برای محدود کردن نمایش Raw Screenshot مهم است. | تولید سرور | بله | V1 |
| AI Extraction | aiConfidence | number | AI model | `0.78` | میزان اطمینان AI. نتیجه AI نباید بدون Confidence استفاده شود. | تولید سرور | بله | MVP |
| AI Extraction | aiSummary | string | AI model | `Employee appears to be editing backend code.` | خلاصه قابل فهم برای مدیر. | تولید سرور | بله | MVP |
| AI Extraction | aiFlags | string[] | AI/rules | `['needs_review']` | پرچم‌های Review مثل low_confidence یا sensitive_content. | تولید سرور | بله | MVP |
| Normalized Result | normalizedSummary | string | Server rules | `Backend development activity detected.` | خلاصه پاک‌سازی‌شده و استاندارد برای Dashboard. | تولید سرور | بله | MVP |
| Normalized Result | focusScore | number | Server calculation | `0.84` | امتیاز تمرکز پیشنهادی. باید به عنوان Signal دیده شود نه حقیقت قطعی. | تولید سرور | بله | MVP |
| Normalized Result | productivitySignal | string/enum | Server calculation | `focused_work` | سیگنال بهره‌وری برای گزارش سطح بالا. | تولید سرور | بله | V1 |
| Normalized Result | reviewStatus | string/enum | Server rules | `auto_accepted` | وضعیت Review: auto_accepted، needs_review، rejected. | تولید سرور | بله | MVP |
| Cost Tracking | aiModelName | string | AI worker | `gpt-4.1-mini` | نام مدل استفاده‌شده برای تحلیل. | تولید سرور | بله | V1 |
| Cost Tracking | inputTokens | integer | AI worker | `1200` | تعداد توکن ورودی یا معادل مصرفی. | تولید سرور | بله | V1 |
| Cost Tracking | outputTokens | integer | AI worker | `180` | تعداد توکن خروجی. | تولید سرور | بله | V1 |
| Cost Tracking | estimatedCostUsd | number | AI worker | `0.0021` | هزینه تخمینی تحلیل همین Capture. برای Pricing حیاتی است. | تولید سرور | بله | V1 |
| Governance | viewedByManagerAtUtc | datetime/null | Dashboard | `2026-06-01T10:31:00Z` | زمان مشاهده Screenshot یا Summary توسط مدیر. | سمت سرور | بله | V1 |
| Governance | viewedByManagerId | string/null | Dashboard | `mgr_10` | شناسه مدیری که داده را دیده است. | سمت سرور | بله | V1 |
| Governance | retentionExpiresAtUtc | datetime | Server policy | `2026-07-01T00:00:00Z` | زمان حذف یا Archive تصویر خام. | سمت سرور | بله | MVP |
| Governance | rawImageDeletedAtUtc | datetime/null | Cleanup job | `null` | زمان حذف تصویر خام. Summary ممکن است بیشتر نگهداری شود. | سمت سرور | بله | V1 |

---

## فیلدهای MVP پیشنهادی

برای نسخه اول محصول، لازم نیست همه فیلدها پیاده‌سازی شوند. این لیست حداقل فیلدهای پیشنهادی برای MVP است:

| بخش | فیلدهای ضروری |
|---|---|
| Identity | `tenantId`, `employeeId`, `deviceId`, `sessionId`, `captureId` |
| Screenshot | `imageFile`, `thumbnailFile`, `capturedAtUtc`, `imageFormat`, `width`, `height`, `fileSizeBytes`, `hashSha256` |
| Window | `foregroundProcessName`, `foregroundAppName`, `activeWindowTitle`, `activeDurationSeconds`, `localAppCategory` |
| Activity | `isIdle`, `idleSeconds`, `screenLocked`, `userSessionState`, `agentPaused`, `pauseReason` |
| Device | `machineName`, `osVersion`, `agentVersion`, `timezone`, `networkStatus` |
| Session | `policyId`, `captureIntervalSeconds`, `sessionStartUtc`, `sessionEndUtc`, `consentStatus` |
| Upload | `uploadAttemptId`, `uploadStatus`, `retryCount`, `lastErrorCode`, `httpStatusCode`, `pendingCaptureCount` |
| Server | `serverCaptureId`, `acceptedAtUtc`, `validationStatus`, `storageKey`, `analysisJobId`, `processingStatus` |
| AI Result | `detectedApplication`, `detectedToolCategory`, `workCategory`, `aiConfidence`, `aiSummary`, `aiFlags` |
| Normalized Result | `normalizedSummary`, `focusScore`, `reviewStatus` |
| Governance | `retentionExpiresAtUtc` |

---

## شکل پیشنهادی JSON برای CapturePackage خام کلاینت

```json
{
  "captureId": "cap_123",
  "tenantId": "tenant_01",
  "employeeId": "emp_44",
  "deviceId": "dev_88",
  "sessionId": "sess_99",
  "policyId": "policy_default",
  "capturedAtUtc": "2026-06-01T10:25:30Z",
  "captureIntervalSeconds": 30,
  "screenshot": {
    "format": "webp",
    "width": 1920,
    "height": 1080,
    "fileSizeBytes": 184320,
    "hashSha256": "a91f...",
    "thumbnailGenerated": true,
    "masked": false,
    "compressionQuality": 70,
    "encryptionMode": "AES-256-GCM"
  },
  "window": {
    "foregroundProcessName": "devenv.exe",
    "foregroundAppName": "Visual Studio",
    "activeWindowTitle": "OrderService.cs - Randevoo",
    "activeDurationSeconds": 42,
    "localAppCategory": "Development"
  },
  "activity": {
    "isIdle": false,
    "idleSeconds": 18,
    "screenLocked": false,
    "userSessionState": "active",
    "agentPaused": false,
    "pauseReason": null
  },
  "client": {
    "machineName": "EMP-LAPTOP-12",
    "agentVersion": "1.0.4",
    "osVersion": "Windows 11 Pro 23H2",
    "timezone": "Asia/Baku",
    "networkStatus": "online"
  },
  "upload": {
    "uploadAttemptId": "upl_123",
    "status": "accepted",
    "retryCount": 0,
    "lastErrorCode": null,
    "httpStatusCode": 202,
    "pendingCaptureCount": 0
  }
}
```

---

## اصول مهم طراحی

### 1. Screenshot به‌تنهایی کافی نیست

اگر فقط تصویر بفرستیم، AI باید خیلی چیزها را حدس بزند. اما اگر تصویر همراه با Window Data و Activity Logs ارسال شود، تحلیل دقیق‌تر، ارزان‌تر و قابل دفاع‌تر می‌شود.

### 2. Window Data گاهی از Screenshot ارزشمندتر است

مثلاً اگر `foregroundProcessName = devenv.exe` و `activeWindowTitle = OrderService.cs` باشد، سیستم قبل از AI هم می‌تواند حدس قوی بزند که کاربر در حال توسعه نرم‌افزار است.

### 3. داده خام با داده تحلیلی فرق دارد

- Raw Data: چیزی که Agent یا Server واقعاً ثبت می‌کند.
- AI Extraction: چیزی که AI از تصویر یا Metadata استخراج می‌کند.
- Normalized Result: خروجی پاک‌سازی‌شده و قابل نمایش در محصول.

### 4. Raw Screenshot باید Retention کوتاه‌تر داشته باشد

پیشنهاد:

| نوع داده | Retention پیشنهادی |
|---|---|
| Raw screenshot | 7 تا 30 روز |
| Thumbnail | 30 تا 90 روز |
| Metadata | 6 تا 24 ماه |
| AI summary | 6 تا 24 ماه |
| Audit log | 12 تا 36 ماه، بسته به مشتری |

### 5. AI Result نباید حقیقت قطعی فرض شود

هر خروجی AI باید همراه با `aiConfidence`، `aiFlags` و `reviewStatus` ذخیره شود.

---

## نام پیشنهادی موجودیت‌ها در سیستم

| نام موجودیت | نقش |
|---|---|
| CapturePackage | بسته خام ساخته‌شده توسط Agent |
| Capture | رکورد اصلی Capture در سرور |
| CaptureImage | اطلاعات فایل تصویر و Thumbnail |
| CaptureWindowContext | اطلاعات پنجره و برنامه فعال |
| CaptureActivitySignal | وضعیت Idle، Mouse، Keyboard و Session ویندوز |
| CaptureUploadAttempt | وضعیت ارسال، Retry و خطاهای آپلود |
| CaptureAnalysisJob | Job پردازش AI در Queue |
| CaptureAnalysisResult | خروجی AI Vision و OCR |
| CaptureNormalizedResult | خروجی استاندارد و قابل نمایش در Dashboard |
| CaptureAuditEvent | لاگ‌های مشاهده، حذف، Policy و Retention |

---

## نتیجه نهایی

CapturePackage هسته اصلی سیستم WorkGraph AI است. هر تصمیم معماری، دیتابیس، API، Queue، AI Analysis، Dashboard و Pricing باید حول این مدل طراحی شود.

بهترین تعریف محصول:

```text
WorkGraph AI does not collect only screenshots.
WorkGraph AI collects structured CapturePackages and converts them into safe, explainable work insights.
```
