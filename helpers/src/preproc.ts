import fs from "fs";
import ejs, { Data } from "ejs";
import path from "path";

function writeFile(filePath: string, data: any) {
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath))
        fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(filePath, data);
}

function buildContracts(folderPath: string, data?: Data) {
    const items = fs.readdirSync(folderPath);

    items.forEach((item) => {
        const fullPath = path.join(folderPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            buildContracts(fullPath, data);
        } else if (stat.isFile() && ((path.extname(fullPath) === '.fc') || (path.extname(fullPath) === '.func'))) {
            const sourceCode = fs.readFileSync(fullPath, "utf8");
            const renderedCode = ejs.render(sourceCode, data, { outputFunctionName: "print" });
            const fullPathBuild = fullPath.replace("contracts", "contracts_build");
            writeFile(fullPathBuild, renderedCode);
        }
    });
}

export function cleanupBuild(folderPath: string = "contracts"): string {
    const buildDir = folderPath + "_build";
    fs.rmSync(buildDir, { recursive: true, force: true });
    return buildDir;
}

export function preprocBuildContracts(opts: { 
    autocleanup?: boolean,
    data?: Data,
}): void {
    const folderPath = "contracts";
    if (opts.autocleanup === undefined)
        opts.autocleanup = true;

    cleanupBuild(folderPath);
    if (opts.autocleanup)
        process.on('exit', (_) => cleanupBuild(folderPath));

    buildContracts(folderPath, opts.data);
}

