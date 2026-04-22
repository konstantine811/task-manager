import {
  addExportVisitor$,
  addImportVisitor$,
  realmPlugin,
  type LexicalVisitor,
  type MdastImportVisitor,
} from "@mdxeditor/editor";
import {
  $createHeadingNode,
  $isHeadingNode,
  type HeadingTagType,
} from "@lexical/rich-text";
import {
  $createParagraphNode,
  $isParagraphNode,
  type ElementFormatType,
} from "lexical";
import type { MdxJsxAttribute, MdxJsxTextElement } from "mdast-util-mdx-jsx";
import type * as Mdast from "mdast";

const ALIGN_TAGS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6"]);

const normalizeElementAlign = (
  format: ElementFormatType,
): "left" | "center" | "right" | "justify" | null => {
  if (format === "left" || format === "start") return "left";
  if (format === "right" || format === "end") return "right";
  if (format === "center") return "center";
  if (format === "justify") return "justify";
  return null;
};

const parseAlignFromAttributes = (
  attributes: MdxJsxTextElement["attributes"],
): ElementFormatType => {
  for (const attr of attributes) {
    if (attr.type !== "mdxJsxAttribute" || attr.name !== "align") continue;
    if (typeof attr.value !== "string") continue;
    const value = attr.value.toLowerCase();
    if (value === "left" || value === "center" || value === "right" || value === "justify") {
      return value;
    }
  }
  return "";
};

const alignedBlockExportVisitor: LexicalVisitor = {
  testLexicalNode(lexicalNode) {
    return $isParagraphNode(lexicalNode) || $isHeadingNode(lexicalNode);
  },
  visitLexicalNode({ lexicalNode, actions }) {
    if (!$isParagraphNode(lexicalNode) && !$isHeadingNode(lexicalNode)) {
      actions.nextVisitor();
      return;
    }

    const align = normalizeElementAlign(lexicalNode.getFormatType());
    if (!align || align === "left") {
      actions.nextVisitor();
      return;
    }

    const tag = $isHeadingNode(lexicalNode) ? lexicalNode.getTag() : "p";
    const attributes: MdxJsxAttribute[] = [
      {
        type: "mdxJsxAttribute",
        name: "align",
        value: align,
      },
    ];

    actions.addAndStepInto("mdxJsxTextElement", {
      type: "mdxJsxTextElement",
      name: tag,
      attributes,
    });
  },
  priority: 100,
};

const alignedBlockImportVisitor: MdastImportVisitor<Mdast.Nodes> = {
  testNode(mdastNode) {
    if (mdastNode.type !== "mdxJsxTextElement") return false;
    const node = mdastNode as MdxJsxTextElement;
    if (typeof node.name !== "string") return false;
    return ALIGN_TAGS.has(node.name);
  },
  visitNode({ mdastNode, actions }) {
    const node = mdastNode as MdxJsxTextElement;
    const align = parseAlignFromAttributes(node.attributes);
    const lexicalNode =
      node.name === "p"
        ? $createParagraphNode()
        : $createHeadingNode(node.name as HeadingTagType);

    if (align) {
      lexicalNode.setFormat(align);
    }

    actions.addAndStepInto(lexicalNode);
  },
  priority: 100,
};

export const journalAlignmentPersistencePlugin = realmPlugin({
  init(realm) {
    realm.pubIn({
      [addExportVisitor$]: alignedBlockExportVisitor,
      [addImportVisitor$]: alignedBlockImportVisitor,
    });
  },
});
