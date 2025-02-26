import { extractData } from "../main-extractor.js";
import { isValidFile } from "../utils/fileValidator.js";
import { validateSchema } from "../utils/schemaValidator.js";
import { getTemplate } from "./templates.js";

/**
 * Extracts data from a document based on a provided schema.
 * @param {object} options - Options for the extraction process.
 * @param {string} options.file - The file path to the document.
 * @param {object} options.schema - The schema definition for data extraction.
 * @param {string} [options.template] - Name of a pre-defined template.
 * @param {string} [options.model] - The llm model to use if a base url is set.
 * @param {string} [options.parseModel] - The llm model to use for parsing the data.
 * @param {boolean} [options.autoSchema] - Option to auto-generate the schema.
 * @param {string} [options.additionalPrompt] - Additional prompt to use for the extraction.
 * @returns {Promise<object>} - The result of the extraction, including pages, extracted data, and file name.
 */
export async function extract({
	file,
	schema,
	template,
	model,
	parseModel,
	autoSchema,
	additionalPrompt,
}) {
	try {
		if (!file) {
			throw new Error("File is required.");
		}

		if (!isValidFile(file)) {
			throw new Error(
				"File must be a valid format: PDF, PNG, JPG, TXT, DOCX, or HTML.",
			);
		}

		let finalSchema = null;
		if (template) {
			finalSchema = getTemplate(template); // Use pre-defined template
		} else if (schema) {
			const { isValid, errors } = validateSchema(schema);
			if (!isValid) {
				throw new Error(`Invalid schema format: ${errors.join(", ")}`);
			}
			finalSchema = schema; // Use custom schema
		} else if (!autoSchema) {
			// If neither schema nor template is provided and autoSchema is not enabled, throw an error.
			throw new Error(
				"You must provide a schema, template, or enable autoSchema.",
			);
		}

		if (additionalPrompt && typeof additionalPrompt !== "string") {
			throw new Error("Additional prompt must be a string.");
		}

		const result = await extractData(
			file,
			finalSchema,
			model,
			parseModel,
			autoSchema,
			additionalPrompt,
		);

		return {
			success: true,
			pages: result.totalPages,
			data: result.event,
			fileName: result.fileName,
		};
	} catch (error) {
		console.error("Error processing document:", error);
		throw new Error(`Failed to process document: ${error.message}`);
	}
}
