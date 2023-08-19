import Api, { RequestMethod } from '@joplin/lib/services/rest/Api';
import { MarkupLanguage, MarkupToHtml } from '@joplin/renderer';
import { Context } from 'vm';
import { ItemFlow, ListRenderer, OnChangeEvent } from './types';

const api = new Api();

interface Props {
	note: {
		id: string;
		title: string;
		is_todo: number;
		todo_completed: number;
		body: string;
	};
	item: {
		size: {
			width: number;
			height: number;
		};
		selected: boolean;
	};
}

const defaultLeftToRightItemRenderer: ListRenderer = {
	flow: ItemFlow.LeftToRight,

	itemSize: {
		width: 150,
		height: 150,
	},

	dependencies: [
		'item.index',
		'item.selected',
		'item.size.width',
		'item.size.height',
		'note.body',
		'note.id',
		'note.is_shared',
		'note.is_todo',
		'note.isWatched',
		'note.titleHtml',
		'note.todo_completed',
	],

	itemCss: // css
		`			
		&:before {
			content: '';
			border-bottom: 1px solid var(--joplin-divider-color);
			width: 90%;
			position: absolute;
			bottom: 0;
			left: 5%;
		}
	
		> .content.-selected {
			background-color: var(--joplin-selected-color);
		}

		&:hover {
			background-color: var(--joplin-background-color-hover3);
		}
	
		> .content.-default {
			display: flex;
			box-sizing: border-box;
			position: relative;
			width: 100%;
			padding: 16px;
			align-items: flex-start;
			overflow-y: hidden;
			flex-direction: column;
	
			> .checkbox {
				display: flex;
				align-items: center;

				> input {
					margin: 0px 10px 1px 0px;
				}
			}
	
			> .title {
				font-family: var(--joplin-font-family);
				font-size: var(--joplin-font-size);
				text-decoration: none;
				color: var(--joplin-color);
				cursor: default;
				flex: 0;
				display: flex;
				align-items: flex-start;
				margin-bottom: 8px;

				> #todo-checkbox {
					margin: 0 6px 0 0;
				}

				> .watchedicon {
					display: none;
					padding-right: 4px;
					color: var(--joplin-color);
				}

				> .titlecontent {
					word-break: break-all;
					overflow: hidden;
					text-overflow: ellipsis;
					text-wrap: nowrap;
				}
			}
		}

		> .content.-shared {
			> .title {
				color: var(--joplin-color-warn3);
			}
		}

		> .content.-completed {
			> .title {
				opacity: 0.5;
				text-decoration: line-through;
			}
		}

		> .content.-watched {
			> .title {
				> .watchedicon {
					display: inline;
				}
			}
		}
	`,

	// itemCss: // css
	// 	`
	// 	&:before {
	// 		content: '';
	// 		border-bottom: 1px solid var(--joplin-divider-color);
	// 		width: 90%;
	// 		position: absolute;
	// 		bottom: 0;
	// 		left: 5%;
	// 	}

	// 	> .content.-selected {
	// 		background-color: var(--joplin-selected-color);
	// 	}

	// 	&:hover {
	// 		background-color: var(--joplin-background-color-hover3);
	// 	}

	// 	> .content.-default {
	// 		display: flex;
	// 		box-sizing: border-box;
	// 		position: relative;
	// 		width: 100%;
	// 		padding: 16px;
	// 		align-items: flex-start;
	// 		overflow-y: hidden;

	// 		> .checkbox {
	// 			display: flex;
	// 			align-items: center;

	// 			> input {
	// 				margin: 0px 10px 1px 0px;
	// 			}
	// 		}

	// 		> .title {
	// 			font-family: var(--joplin-font-family);
	// 			font-size: var(--joplin-font-size);
	// 			text-decoration: none;
	// 			color: var(--joplin-color);
	// 			cursor: default;
	// 			flex: 1 1 0%;
	// 			display: flex;
	// 			align-items: center;

	// 			> .watchedicon {
	// 				display: none;
	// 				padding-right: 4px;
	// 				color: var(--joplin-color);
	// 			}

	// 			> .titlecontent {
	// 				word-break: break-all;
	// 				overflow: hidden;
	// 			}
	// 		}
	// 	}

	// 	> .content.-shared {
	// 		> .title {
	// 			color: var(--joplin-color-warn3);
	// 		}
	// 	}

	// 	> .content.-completed {
	// 		> .title {
	// 			opacity: 0.5;
	// 			text-decoration: line-through;
	// 		}
	// 	}

	// 	> .content.-watched {
	// 		> .title {
	// 			> .watchedicon {
	// 				display: inline;
	// 			}
	// 		}
	// 	}
	// `,

	itemTemplate: // html
		`
		<div class="content -default {{#item.selected}}-selected{{/item.selected}} {{#note.is_shared}}-shared{{/note.is_shared}} {{#note.todo_completed}}-completed{{/note.todo_completed}} {{#note.isWatched}}-watched{{/note.isWatched}}">
			<a href="#" style="width: {{contentWidth}}px;" class="title" draggable="true" data-id="{{note.id}}">
				{{#note.is_todo}}
				<input id="todo-checkbox" type="checkbox" {{#note.todo_completed}}checked="checked"{{/note.todo_completed}}>
				{{/note.is_todo}}
				<i class="watchedicon fa fa-share-square"></i>
				<div class="titlecontent">{{item.index}} {{{note.titleHtml}}}</div>
			</a>
			<div class="preview">{{notePreview}}</div>
		</div>
	`,

	// itemTemplate: // html
	// 	`
	// 	<div class="content -default {{#item.selected}}-selected{{/item.selected}} {{#note.is_shared}}-shared{{/note.is_shared}} {{#note.todo_completed}}-completed{{/note.todo_completed}} {{#note.isWatched}}-watched{{/note.isWatched}}">
	// 		{{#note.is_todo}}
	// 			<div class="checkbox">
	// 				<input id="todo-checkbox" type="checkbox" {{#note.todo_completed}}checked="checked"{{/note.todo_completed}}>
	// 			</div>
	// 		{{/note.is_todo}}
	// 		<a href="#" class="title" draggable="true" data-id="{{note.id}}">
	// 			<i class="watchedicon fa fa-share-square"></i>
	// 			<div class="titlecontent" style="width: {{contentWidth}}px; height: {{contentHeight}}px">{{item.index}} {{{note.titleHtml}}}<br/><br/>{{notePreview}}</div>
	// 		</a>
	// 	</div>
	// `,

	onChange: async (context: Context, elementId: string, event: OnChangeEvent) => {
		if (elementId === 'todo-checkbox') {
			await api.route(RequestMethod.PUT, `notes/${context.noteId}`, null, JSON.stringify({
				todo_completed: event.value ? Date.now() : 0,
			}));
		} else {
			throw new Error(`Unknown element ID: ${elementId}`);
		}
	},

	onRenderNote: async (props: Props) => {
		const markupToHtml_ = new MarkupToHtml();

		return {
			...props,
			notePreview: markupToHtml_.stripMarkup(MarkupLanguage.Markdown, props.note.body).substring(0, 200),
			contentWidth: props.item.size.width - 32,
			contentHeight: props.item.size.height - 32,
		};
	},
};

export default defaultLeftToRightItemRenderer;