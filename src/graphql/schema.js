import { GraphQLObjectType, GraphQLSchema } from 'graphql';

// Get individual objects
import GetArticle from './queries/GetArticle';
import GetReply from './queries/GetReply';
import GetUser from './queries/GetUser';
import ListArticles from './queries/ListArticles';
import ListReplies from './queries/ListReplies';
import ListCategories from './queries/ListCategories';

// Set individual objects
import CreateArticle from './mutations/CreateArticle';
import CreateReply from './mutations/CreateReply';
import CreateArticleReply from './mutations/CreateArticleReply';
import CreateArticleCategory from './mutations/CreateArticleCategory';
import CreateOrUpdateArticleReplyFeedback from './mutations/CreateOrUpdateArticleReplyFeedback';
import CreateOrUpdateReplyRequestFeedback from './mutations/CreateOrUpdateReplyRequestFeedback';
import CreateOrUpdateArticleCategoryFeedback from './mutations/CreateOrUpdateArticleCategoryFeedback';
import CreateOrUpdateReplyRequest from './mutations/CreateOrUpdateReplyRequest';
import UpdateArticleReplyStatus from './mutations/UpdateArticleReplyStatus';
import UpdateArticleCategoryStatus from './mutations/UpdateArticleCategoryStatus';
import UpdateUser from './mutations/UpdateUser';

export default new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      GetArticle,
      GetReply,
      GetUser,
      ListArticles,
      ListReplies,
      ListCategories,
    },
  }),
  mutation: new GraphQLObjectType({
    name: 'Mutation',
    fields: {
      CreateArticle,
      CreateReply,
      CreateArticleReply,
      CreateArticleCategory,
      CreateReplyRequest: {
        ...CreateOrUpdateReplyRequest,
        deprecationReason: 'Use CreateOrUpdateReplyRequest instead',
      },
      CreateOrUpdateReplyRequest,
      CreateOrUpdateArticleReplyFeedback,
      CreateOrUpdateArticleCategoryFeedback,
      CreateOrUpdateReplyRequestFeedback,
      UpdateArticleReplyStatus,
      UpdateArticleCategoryStatus,
      UpdateUser,
    },
  }),
});
