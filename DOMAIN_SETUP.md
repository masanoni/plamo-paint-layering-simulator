# カスタムドメイン設定手順

## 1. ドメインの取得
- お名前.com、ムームードメイン、Google Domainsなどでドメインを取得
- 例: `your-site-name.com`

## 2. Netlifyでのドメイン設定
1. Netlifyダッシュボードにログイン
2. サイトを選択
3. "Domain settings" → "Add custom domain"
4. 取得したドメインを入力

## 3. DNS設定
ドメイン管理画面で以下のDNSレコードを設定：

### Aレコード（ルートドメイン用）
- ホスト名: @ または空欄
- 値: 75.2.60.5

### CNAMEレコード（www用）
- ホスト名: www
- 値: chimerical-caramel-48ed3f.netlify.app

## 4. SSL証明書の有効化
Netlifyが自動でLet's Encrypt SSL証明書を発行します（通常24時間以内）

## 5. HTTPSリダイレクトの有効化
Netlifyの設定で "Force HTTPS" を有効にする