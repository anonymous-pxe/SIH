import { schemaService } from '../services/schemaService';
import { FormSchema, CustomFunction } from '../types';

export interface ProjectContext {
  projectName: string;
  schemas: FormSchema[];
  customFunctions: CustomFunction[];
  summary: {
    totalSchemas: number;
    totalCustomFunctions: number;
    totalFields: number;
    mandatoryFieldsCount: number;
  };
}

export class ContextLoader {
  /**
   * Load active application context from MongoDB / schema registry for a given project.
   */
  async loadProjectContext(projectName: string = 'nexasupply'): Promise<ProjectContext> {
    const schemas = await schemaService.getSchemasForProject(projectName);
    const customFunctions = await schemaService.getCustomFunctionsForProject(projectName);

    let totalFields = 0;
    let mandatoryFieldsCount = 0;

    for (const schema of schemas) {
      totalFields += schema.fields.length;
      mandatoryFieldsCount += schema.fields.filter(f => f.mandatoryField).length;
    }

    return {
      projectName,
      schemas,
      customFunctions,
      summary: {
        totalSchemas: schemas.length,
        totalCustomFunctions: customFunctions.length,
        totalFields,
        mandatoryFieldsCount,
      },
    };
  }
}

export const contextLoader = new ContextLoader();
