import { spawn, exec, ChildProcess } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

interface ChromeProcess {
  process: ChildProcess | null;
  pid: number | null;
  port: number;
  userDataDir: string;
  startTime: Date | null;
}

export class ChromeManager {
  private chromeProcess: ChromeProcess = {
    process: null,
    pid: null,
    port: 9222,
    userDataDir: '',
    startTime: null,
  };

  constructor(port: number = 9222) {
    this.chromeProcess.port = port;
    this.setupUserDataDir();
  }

  /**
   * OS별 사용자 데이터 디렉토리 설정
   */
  private setupUserDataDir() {
    const platform = os.platform();
    const tmpDir = os.tmpdir();
    
    switch (platform) {
      case 'darwin': // macOS
        this.chromeProcess.userDataDir = path.join(tmpDir, 'chrome-debug-macos');
        break;
      case 'win32': // Windows
        this.chromeProcess.userDataDir = path.join(tmpDir, 'chrome-debug-windows');
        break;
      default: // Linux
        this.chromeProcess.userDataDir = path.join(tmpDir, 'chrome-debug-linux');
    }
  }

  /**
   * OS별 Chrome 실행 경로 가져오기
   */
  private getChromeExecutablePath(): string[] {
    const platform = os.platform();
    
    switch (platform) {
      case 'darwin': // macOS
        return [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Chromium.app/Contents/MacOS/Chromium',
          'google-chrome',
          'chromium'
        ];
        
      case 'win32': // Windows
        return [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Users\\' + os.userInfo().username + '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
          'chrome.exe',
          'google-chrome'
        ];
        
      default: // Linux
        return [
          'google-chrome',
          'google-chrome-stable',
          'chromium-browser',
          'chromium',
          '/usr/bin/google-chrome',
          '/usr/bin/chromium-browser'
        ];
    }
  }

  /**
   * 사용 가능한 Chrome 실행 파일 찾기
   */
  private async findChromeExecutable(): Promise<string | null> {
    const possiblePaths = this.getChromeExecutablePath();
    
    for (const chromePath of possiblePaths) {
      try {
        await execAsync(`"${chromePath}" --version`);
        console.log(`✅ Chrome found: ${chromePath}`);
        return chromePath;
      } catch (error) {
        // 이 경로에서는 Chrome을 찾을 수 없음, 다음 경로 시도
        continue;
      }
    }
    
    return null;
  }

  /**
   * 기존 Chrome 프로세스 종료
   */
  private async killExistingChrome(): Promise<void> {
    const platform = os.platform();
    
    try {
      if (platform === 'win32') {
        await execAsync('taskkill /F /IM chrome.exe');
      } else {
        await execAsync('pkill -f "chrome.*remote-debugging-port"');
      }
      console.log('🔄 기존 Chrome 프로세스 종료됨');
      
      // 잠시 대기 (프로세스 완전 종료 대기)
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      // 기존 프로세스가 없거나 종료 실패 - 무시하고 계속 진행
      console.log('📝 기존 Chrome 프로세스 없음 또는 종료 실패 (정상)');
    }
  }

  /**
   * Chrome 디버그 모드 시작
   */
  async startChromeDebug(): Promise<{success: boolean; message: string; details?: any}> {
    try {
      // 이미 실행 중인지 확인
      if (this.chromeProcess.process && !this.chromeProcess.process.killed) {
        return {
          success: false,
          message: 'Chrome 디버그 모드가 이미 실행 중입니다.',
          details: {
            pid: this.chromeProcess.pid,
            port: this.chromeProcess.port,
            startTime: this.chromeProcess.startTime,
          }
        };
      }

      // Chrome 실행 파일 찾기
      const chromePath = await this.findChromeExecutable();
      if (!chromePath) {
        return {
          success: false,
          message: 'Chrome 브라우저를 찾을 수 없습니다. Chrome이 설치되어 있는지 확인하세요.',
        };
      }

      // 기존 Chrome 프로세스 종료
      await this.killExistingChrome();

      // Chrome 디버그 모드 실행
      const args = [
        `--remote-debugging-port=${this.chromeProcess.port}`,
        `--user-data-dir=${this.chromeProcess.userDataDir}`,
        '--no-first-run',
        '--disable-default-apps',
        '--disable-popup-blocking',
        '--disable-translate',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        'https://naver.com'
      ];

      console.log(`🚀 Chrome 실행 중: ${chromePath} ${args.join(' ')}`);

      const chromeProcess = spawn(chromePath, args, {
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // 프로세스 정보 저장
      this.chromeProcess.process = chromeProcess;
      this.chromeProcess.pid = chromeProcess.pid || null;
      this.chromeProcess.startTime = new Date();

      // 프로세스 이벤트 리스너
      chromeProcess.on('error', (error) => {
        console.error('Chrome 프로세스 오류:', error);
        this.chromeProcess.process = null;
        this.chromeProcess.pid = null;
      });

      chromeProcess.on('exit', (code, signal) => {
        console.log(`Chrome 프로세스 종료: code=${code}, signal=${signal}`);
        this.chromeProcess.process = null;
        this.chromeProcess.pid = null;
        this.chromeProcess.startTime = null;
      });

      // Chrome이 완전히 시작될 때까지 대기
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 디버그 포트 연결 확인
      const isConnected = await this.checkDebugConnection();
      
      if (isConnected) {
        return {
          success: true,
          message: `Chrome 디버그 모드가 성공적으로 시작되었습니다! (포트: ${this.chromeProcess.port})`,
          details: {
            pid: this.chromeProcess.pid,
            port: this.chromeProcess.port,
            userDataDir: this.chromeProcess.userDataDir,
            startTime: this.chromeProcess.startTime,
            chromePath,
          }
        };
      } else {
        return {
          success: false,
          message: 'Chrome은 실행되었지만 디버그 포트 연결에 실패했습니다.',
        };
      }

    } catch (error) {
      console.error('Chrome 시작 오류:', error);
      return {
        success: false,
        message: `Chrome 시작 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      };
    }
  }

  /**
   * Chrome 디버그 모드 종료
   */
  async stopChromeDebug(): Promise<{success: boolean; message: string}> {
    try {
      if (!this.chromeProcess.process || this.chromeProcess.process.killed) {
        return {
          success: false,
          message: 'Chrome 디버그 모드가 실행되고 있지 않습니다.',
        };
      }

      // 프로세스 종료
      this.chromeProcess.process.kill('SIGTERM');
      
      // 강제 종료 대기
      setTimeout(() => {
        if (this.chromeProcess.process && !this.chromeProcess.process.killed) {
          this.chromeProcess.process.kill('SIGKILL');
        }
      }, 5000);

      // 프로세스 정보 초기화
      this.chromeProcess.process = null;
      this.chromeProcess.pid = null;
      this.chromeProcess.startTime = null;

      return {
        success: true,
        message: 'Chrome 디버그 모드가 종료되었습니다.',
      };

    } catch (error) {
      console.error('Chrome 종료 오류:', error);
      return {
        success: false,
        message: `Chrome 종료 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      };
    }
  }

  /**
   * 디버그 포트 연결 확인
   */
  private async checkDebugConnection(): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:${this.chromeProcess.port}/json/version`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * 실제 시스템에서 PID가 실행 중인지 확인
   */
  private async isProcessRunning(pid: number): Promise<boolean> {
    try {
      const platform = os.platform();
      
      if (platform === 'win32') {
        // Windows: tasklist 사용
        const { stdout } = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`);
        return stdout.includes(`"${pid}"`);
      } else {
        // macOS/Linux: ps 사용
        const { stdout } = await execAsync(`ps -p ${pid} -o pid=`);
        return stdout.trim() === pid.toString();
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * 디버그 포트로 실행 중인 Chrome 프로세스 찾기
   */
  private async findDebugChromePid(): Promise<number | null> {
    try {
      const platform = os.platform();
      const port = this.chromeProcess.port;
      
      if (platform === 'win32') {
        // Windows: netstat + tasklist 조합
        const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
        const lines = stdout.split('\n');
        for (const line of lines) {
          const match = line.match(/\s+(\d+)$/);
          if (match) {
            return parseInt(match[1]);
          }
        }
      } else {
        // macOS/Linux: lsof 사용
        const { stdout } = await execAsync(`lsof -ti :${port}`);
        const pid = parseInt(stdout.trim());
        if (!isNaN(pid)) {
          return pid;
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Chrome 프로세스 상태 확인 (실제 시스템 상태 반영)
   */
  async getStatus() {
    const basicStatus = {
      isRunning: this.chromeProcess.process !== null && !this.chromeProcess.process.killed,
      pid: this.chromeProcess.pid,
      port: this.chromeProcess.port,
      userDataDir: this.chromeProcess.userDataDir,
      startTime: this.chromeProcess.startTime,
    };

    // 저장된 PID가 있으면 실제로 실행 중인지 확인
    if (this.chromeProcess.pid) {
      const actuallyRunning = await this.isProcessRunning(this.chromeProcess.pid);
      
      if (!actuallyRunning) {
        // 프로세스가 실제로는 종료됨 - 상태 업데이트
        console.log(`⚠️  Chrome 프로세스 ${this.chromeProcess.pid}가 외부에서 종료됨`);
        this.chromeProcess.process = null;
        this.chromeProcess.pid = null;
        this.chromeProcess.startTime = null;
        
        return {
          ...basicStatus,
          isRunning: false,
          pid: null,
          startTime: null,
        };
      }
    }

    // 저장된 PID가 없지만 디버그 포트가 열려있는 경우
    if (!this.chromeProcess.pid) {
      const debugPid = await this.findDebugChromePid();
      if (debugPid) {
        console.log(`🔍 디버그 포트에서 Chrome PID 발견: ${debugPid}`);
        this.chromeProcess.pid = debugPid;
        
        return {
          ...basicStatus,
          isRunning: true,
          pid: debugPid,
        };
      }
    }

    return basicStatus;
  }
} 