/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { GraphQLString, GraphQLObjectType } from 'graphql';
import LessonType from 'gql/types/lesson';
import { Lesson as LessonModel, Session as SessionModel } from 'models';
import { Lesson } from 'models/Lesson';
import { User } from 'models/User';

export const deleteLesson = {
  type: LessonType,
  args: {
    lessonId: { type: GraphQLString },
  },
  resolve: async (
    _root: GraphQLObjectType,
    args: { lessonId: string },
    context: { user: User }
  ): Promise<Lesson> => {
    if (!args.lessonId) {
      throw new Error('missing required param lessonId');
    }
    const lesson = await LessonModel.findOne({ lessonId: args.lessonId });
    if (lesson.deleted || lesson.lessonId.startsWith('_deleted_')) {
      throw new Error('lesson was already deleted');
    }
    if (!LessonModel.userCanEdit(context.user, lesson)) {
      throw new Error('user does not have permission to edit this lesson');
    }

    const date = new Date();
    const deletedId = `_deleted_${args.lessonId}_${date.getTime()}`;
    await SessionModel.updateMany(
      {
        lessonId: args.lessonId,
      },
      {
        $set: {
          deleted: true,
          lessonId: deletedId,
        },
      }
    );
    return await LessonModel.findOneAndUpdate(
      {
        lessonId: args.lessonId,
      },
      {
        $set: {
          deleted: true,
          lessonId: deletedId,
        },
      },
      {
        new: true, // return the updated doc rather than pre update
      }
    );
  },
};

export default deleteLesson;
