import fs from 'fs';
import path from 'path';

// Simple environment checker for hackathon setup.
// ハッカソン用の簡易環境チェック。

type EnvCheck = {
  name: string;
  required: string[];
};

const checks: EnvCheck[] = [
  {
    name: 'apps/web/.env',
    required: [
      'VITE_MB_BASE_URL',
      'VITE_MB_API_KEY',
      'VITE_STABLECOIN_CONTRACT_LABEL',
      'VITE_STABLECOIN_ADDRESS_ALIAS',
      'VITE_VOUCHER_CONTRACT_LABEL',
      'VITE_VOUCHER_ADDRESS_ALIAS'
    ]
  },
  {
    name: 'contracts/.env',
    required: ['DEPLOYER_KEY', 'KAIGAN_RPC_URL', 'SEPOLIA_RPC_URL']
  }
];

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const result: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    result[key] = rest.join('=');
  }
  return result;
}

function main() {
  const root = path.resolve(__dirname, '..');
  let hasMissing = false;

  console.log('Doctor: environment check');
  console.log('Doctor: 環境チェック');

  for (const check of checks) {
    const filePath = path.join(root, check.name);
    const env = parseEnvFile(filePath);
    const missing = check.required.filter((key) => !env[key]);

    console.log(`\n${check.name}`);
    if (!fs.existsSync(filePath)) {
      console.log('  Missing file / ファイル未作成');
      hasMissing = true;
      continue;
    }

    if (missing.length === 0) {
      console.log('  OK');
    } else {
      hasMissing = true;
      console.log('  Missing keys / 不足キー:');
      for (const key of missing) {
        console.log(`  - ${key}`);
      }
    }
  }

  if (hasMissing) {
    console.log('\nFix the missing values and re-run.');
    console.log('不足を修正して再実行してください。');
    process.exit(1);
  }

  console.log('\nAll checks passed.');
  console.log('すべてのチェックに合格しました。');
}

main();
