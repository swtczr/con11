# Actions GPT App


### Strict via Actions GPT
Backend calls your Custom GPT (`GPT_MODEL`) which uses the Action (OpenAPI) to reach Make and returns JSON `{status,data:{description,link}}`.


## Actions GPT Setup Guide (где взять GPT_MODEL и как подключить)

### 1) Что нужно заранее
- Аккаунт ChatGPT Plus / Team / Enterprise.
- Твой OpenAPI (Find Document by Code API).
- Рабочий Make-сценарий с вебхуком.

### 2) Создай Custom GPT с Action
1. ChatGPT → **Explore GPTs** → **Create**.
2. **Configure**: Name = `FindDocGPT`, Description = «Находит документы по коду через Make».
3. **Actions**: **Import from file** → загрузи свой OpenAPI (`.yaml/.json`).
   - Base URL: `https://hook.eu2.make.com/h3vew3447rab8adiuyoo6wxi2319bzbu`
   - Auth: None
4. **Instructions** — добавь правило вывода:
   ```
   Если пользователь вводит код (например: ks.010.030.wh),
   вызови Action findDocumentByCode и верни ответ строго в формате JSON:
   {"status":"success","data":{"description":"...","link":"..."}}
   При ошибке: {"status":"error","message":"..."}
   ```
5. **Save**.

### 3) Где взять GPT_MODEL
Открой сохранённый GPT → в URL будет вид:  
`https://chat.openai.com/g/g-abc12345def6789`  
Кусок `g-abc12345def6789` — это и есть **GPT_MODEL**.

### 4) Переменные окружения на Vercel
В **Project Settings → Environment Variables** добавь:
- `OPENAI_API_KEY = sk-...`
- `GPT_MODEL = g-abc12345def6789`

После сохранения — redeploy.

### 5) Как работает цепочка
UI → `/api/chat` → **твой Custom GPT (GPT_MODEL)** → Action (OpenAPI → Make) → JSON → UI.

### 6) Тест через curl
```bash
curl -X POST https://<project>.vercel.app/api/chat   -H "Content-Type: application/json"   -d '{"code":"ks.010.030.wh"}'
```
Ожидаемый ответ:
```json
{ "status":"success", "data": { "description":"...", "link":"..." } }
```



### Link normalization & light markdown
UI автоматически:
- превращает `link`, если он приходит как ID (без `https://`), в кликабельный URL Google Drive;
- поддерживает **жирный** (`**bold**`) и переносы строк в `description`.
