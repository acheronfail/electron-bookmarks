import * as dialog from './dialog';
import * as bookmarks from './bookmarks';

const electronBookmarks = Object.assign({}, dialog, bookmarks);

export default electronBookmarks;
