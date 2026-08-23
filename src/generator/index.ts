import { contextLoader } from './contextLoader';
import { catalogBuilder } from './catalogBuilder';
import { specWriter } from './specWriter';
import { testRunner } from './runner';
import { GenerateTestsRequest, GenerateTestsResponse } from '../types';

export class GeneratorEngine {
  /**
   * Main entry point for POST /test-gen/generate
   */
  async generate(req: GenerateTestsRequest): Promise<GenerateTestsResponse> {
    const projectName = req.projectName || 'nexasupply';
    const outputDir = req.outputDir || process.env.TEST_DIR || './tests';
    const previewOnly = req.previewOnly ?? false;

    // 1. Load context from MongoDB/Registry
    const context = await contextLoader.loadProjectContext(projectName);

    // If specific schemas requested, filter
    if (req.schemas && req.schemas.length > 0) {
      context.schemas = context.schemas.filter(s => req.schemas!.includes(s.schemaName));
    }

    // 2. Build official Test Catalogue JSON
    const catalogue = catalogBuilder.buildCatalog(context, req.requirement, req.options);

    // 3. Write Playwright TypeScript .spec.ts files (if not previewOnly)
    let filesWritten: string[] = [];
    let filesMetadata: any[] = [];

    if (!previewOnly) {
      const writeResult = await specWriter.writeSpecs(context, outputDir);
      filesWritten = writeResult.filesWritten;
      filesMetadata = writeResult.filesMetadata;
    }

    return {
      success: true,
      projectName,
      catalogue,
      filesWritten,
      filesMetadata,
      totalTests: catalogue.totalTests,
      outputDir,
      previewOnly,
      message: previewOnly
        ? `Generated catalog containing ${catalogue.totalTests} tests (preview mode)`
        : `Successfully generated ${catalogue.totalTests} Playwright tests across ${filesWritten.length} files.`,
    };
  }
}

export const generatorEngine = new GeneratorEngine();
export { contextLoader, catalogBuilder, specWriter, testRunner };
