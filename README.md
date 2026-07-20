# VK Integration Skill — end-to-end demo

## Реалистичный пользовательский prompt

> У нас SaaS «Бизнес Пульс» на Next.js, Vercel и Supabase. Сделай вход через VK ID так, чтобы повторный вход возвращал человека в существующий аккаунт, а не создавал дубль. После входа пользователь должен подключить личную страницу и сообщества по ссылкам `vk.com/club123`, `vk.ru/public123`, `vk.ru/event123` или короткому имени. Статистику собирай в фоне, сохраняй по периодам и показывай `needs_sync`, пока не было успешного обновления. На Vercel появляется ошибка `access_token was given to another ip address`, поэтому не используй пользовательский токен для аналитики. Секреты не должны попадать в браузер и логи.

## Что демонстрирует проект

- два независимых контура: VK ID для identity и `VK_SERVICE_TOKEN` для аналитики;
- `state` + PKCE + короткоживущая httpOnly cookie (политика callback описана в `src/oauth-policy.js`);
- поиск identity до создания пользователя;
- нормализация ссылок `vk.com`, `vk.ru`, `vkontakte.ru`;
- рабочее разрешение короткого домена: `groups.getById` с `group_id` на API `5.130`;
- дальнейшая работа только с числовым ID через API `5.199`;
- состояния `needs_sync`, `connected`, `error`;
- upsert метрик по `(user_id, platform, channel_id, period)`;
- структурированные ошибки по этапам без значений токенов;
- SQL-схема с уникальными ограничениями и RLS.

## Важное исправление для коротких ссылок

Для ссылки вроде `https://vk.ru/volthash`:

1. Нормализовать домен до `volthash`.
2. Вызвать `groups.getById` с `group_id=volthash` и `v=5.130`.
3. Получить числовой ID сообщества.
4. Запрашивать профиль и статистику по числовому ID с `v=5.199`.

Не использовать для этого `groups.search`, `utils.resolveScreenName` или `group_ids`: для некоторых сервисных профилей VK ID они возвращают `Method is not available for this profile type`, `group_id not domain` или `group_ids is undefined`.

Это безопасный исполняемый пример: VK и база заменены in-memory адаптерами. Для production нужно реализовать те же интерфейсы через актуальные документированные VK endpoint и Supabase, не меняя доменную логику.

## Запуск

```bash
npm test
```

## Проверенный путь

`browser callback → identity link → vk.ru short-domain resolve (5.130) → numeric group ID → VK service-token sync (5.199) → metrics upsert → UI read`

Параметры VK API зависят от типа приложения и токена. Перед production-подключением сверяйте их с документацией, но сохраняйте проверенное разделение identity, resolution и analytics.
