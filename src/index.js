import { init } from './util';
import * as dialog from './dialog';
import * as bookmarks from './bookmarks';

const electronBookmarks = Object.assign({}, dialog, bookmarks, { init });

export default electronBookmarks;
