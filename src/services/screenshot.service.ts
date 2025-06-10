import puppeteer, { Browser, Page, Protocol } from 'puppeteer';

interface SSOLoginData {
  screenshot: string;
  csrf: string;
  session: string;
  xsrf: string;
}

export class ScreenshotService {
  private static readonly SSO_URL = 'https://sso.ncnu.edu.tw/login';
  private static readonly BROWSER_OPTIONS = {
    args: ['--no-sandbox'],
    timeout: 10000,
  };

  private async initializeBrowser(): Promise<Browser> {
    try {
      return await puppeteer.launch(ScreenshotService.BROWSER_OPTIONS);
    } catch (error) {
      throw new Error(`Failed to launch browser: ${error}`);
    }
  }

  private async extractCsrfToken(source: string): Promise<string> {
    try {
      return source.split("csrf-token")[1].split('content="')[1].split('"')[0];
    } catch (error) {
      throw new Error('Failed to extract CSRF token from page source');
    }
  }

  private async getCookieValue(cookies: Protocol.Network.Cookie[], index: number): Promise<string> {
    try {
      return JSON.parse(JSON.stringify(Object.values(cookies)[index])).value;
    } catch (error) {
      throw new Error(`Failed to extract cookie value at index ${index}`);
    }
  }

  public async captureLoginPage(): Promise<SSOLoginData> {
    let browser: Browser | null = null;
    
    try {
      browser = await this.initializeBrowser();
      const page = await browser.newPage();
      const response = await page.goto(ScreenshotService.SSO_URL);

      if (!response) {
        throw new Error('Failed to load the SSO page');
      }

      const [screenshot, source, cookies] = await Promise.all([
        page.screenshot({ encoding: 'base64' }),
        response.text(),
        page.cookies()
      ]);

      const csrf = await this.extractCsrfToken(source);
      const session = await this.getCookieValue(cookies, 0);
      const xsrf = await this.getCookieValue(cookies, 1);

      return {
        screenshot: screenshot as string,
        csrf,
        session,
        xsrf
      };
    } catch (error) {
      throw new Error(`Screenshot service error: ${error}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  public generateLoginHtml(data: SSOLoginData): string {
    return `
      <div class="login-container">
        <div class="login-form">
          <div class="input-group">
            <label for="account">帳號：</label>
            <input id="account" type="text" />
          </div>
          <div class="input-group">
            <label for="password">密碼：</label>
            <input id="password" type="password" />
          </div>
          <div class="input-group">
            <label for="captcha">驗證碼：</label>
            <input id="captcha" type="text" />
          </div>
          <button onclick="submitLogin()">送出</button>
        </div>
        
        <div class="hidden-data" style="display:none">
          <div id="csrf">${data.csrf}</div>
          <div id="xsrf">${data.xsrf}</div>
          <div id="session">${data.session}</div>
        </div>
        
        <div class="captcha-image">
          <img src="data:image/png;base64,${data.screenshot}" alt="Captcha" />
        </div>
      </div>
      
      <style>
        .login-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
        }
        .login-form {
          margin-bottom: 20px;
        }
        .input-group {
          margin-bottom: 10px;
        }
        .input-group label {
          display: inline-block;
          width: 80px;
        }
        button {
          margin-top: 10px;
          padding: 5px 15px;
        }
        .captcha-image img {
          max-width: 100%;
        }
      </style>
      
      <script src="https://cdnjs.cloudflare.com/ajax/libs/axios/0.27.2/axios.min.js"></script>
      <script src="js/sso_login.js"></script>
    `;
  }
} 