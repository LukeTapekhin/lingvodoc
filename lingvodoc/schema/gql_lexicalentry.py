import graphene

from lingvodoc.schema.gql_holders import (
    LingvodocObjectType,
    CompositeIdHolder,
    AdditionalMetadata,
    CreatedAt,
    MarkedForDeletion,
    Relationship,
    MovedTo,
    fetch_object,
    client_id_check,
    del_object,
    acl_check_by_id,
    ResponseError,
    LingvodocID,
    ObjectVal
)

from lingvodoc.models import (
    Entity as dbEntity,
    Field as dbField,
    PublishingEntity as dbPublishingEntity,
    LexicalEntry as dbLexicalEntry,
    Client,
    DBSession,
    DictionaryPerspective as dbDictionaryPerspective,
    Group as dbGroup,
    LexicalEntry as dbLexicalEntry,
    User as dbUser,
    ObjectTOC as dbObjectTOC,
    BaseGroup as dbBaseGroup
)
from lingvodoc.schema.gql_entity import Entity
from lingvodoc.utils.verification import check_client_id
from lingvodoc.views.v2.delete import real_delete_lexical_entry

from lingvodoc.utils.creation import create_lexicalentry
from pyramid.security import authenticated_userid
from lingvodoc.utils.search import find_all_tags, find_lexical_entries_by_tags
import time
import string
import random

class LexicalEntry(LingvodocObjectType):
    """
     #created_at          | timestamp without time zone | NOT NULL
     #object_id           | bigint                      | NOT NULL
     #client_id           | bigint                      | NOT NULL
     #parent_object_id    | bigint                      |
     #parent_client_id    | bigint                      |
     #marked_for_deletion | boolean                     | NOT NULL
     #moved_to            | text                        |
     #additional_metadata | jsonb                       |
    """
    entities = graphene.List(Entity)
    dbType = dbLexicalEntry

    class Meta:
        interfaces = (CompositeIdHolder, AdditionalMetadata, CreatedAt, MarkedForDeletion, Relationship, MovedTo)
    @fetch_object('entities')
    @acl_check_by_id('view', 'lexical_entries_and_entities')
    def resolve_entities(self, info):
        result = list()
        for db_entity in self.dbObject.entity:
            gr_entity_object = Entity(id=[db_entity.client_id, db_entity.object_id])
            gr_entity_object.dbObject = db_entity
            result.append(gr_entity_object)
        return result






class CreateLexicalEntry(graphene.Mutation):
    """
    example:
    mutation {
        create_lexicalentry(id: [949,21], perspective_id: [71,5]) {
            field {
                id
            }
            triumph
        }
    }

    (this example works)
    returns:

    {
      "create_lexicalentry": {
        "field": {
          "id": [
            949,
            21
          ]
        },
        "triumph": true
      }
    }
    """

    class Arguments:
        id = LingvodocID()
        perspective_id = LingvodocID(required=True)

    lexicalentry = graphene.Field(LexicalEntry)
    triumph = graphene.Boolean()

    @staticmethod
    @client_id_check()
    def mutate(root, info, **args):
        perspective_id = args.get('perspective_id')
        id = args.get('id')
        client_id = id[0] if id else info.context["client_id"]
        object_id = id[1] if id else None
        id = [client_id, object_id]
        dblexentry = create_lexicalentry(id, perspective_id, True)
        """
        perspective_client_id = perspective_id[0]
        perspective_object_id = perspective_id[1]

        object_id = None
        client_id_from_args = None
        if len(id) == 1:
            client_id_from_args = id[0]
        elif len(id) == 2:
            client_id_from_args = id[0]
            object_id = id[1]

        client_id = info.context["client_id"]
        client = DBSession.query(Client).filter_by(id=client_id).first()

        user = DBSession.query(dbUser).filter_by(id=client.user_id).first()
        if not user:
            raise ResponseError(message="This client id is orphaned. Try to logout and then login once more.")

        perspective = DBSession.query(dbDictionaryPerspective). \
            filter_by(client_id=perspective_client_id, object_id=perspective_object_id).first()
        if not perspective:
            raise ResponseError(message="No such perspective in the system")

        if client_id_from_args:
            if check_client_id(authenticated=client.id, client_id=client_id_from_args):
                client_id = client_id_from_args
            else:
                raise ResponseError(message="Error: client_id from another user")

        dblexentry = dbLexicalEntry(object_id=object_id, client_id=client_id,
                               parent_object_id=perspective_object_id, parent=perspective)
        DBSession.add(dblexentry)
        DBSession.flush()
        """
        lexicalentry = LexicalEntry(id=[dblexentry.client_id, dblexentry.object_id])
        lexicalentry.dbObject = dblexentry
        return CreateLexicalEntry(lexicalentry=lexicalentry, triumph=True)

class DeleteLexicalEntry(graphene.Mutation):
    """
    example:
    mutation {
        delete_lexicalentry(id: [949,21]) {
            lexicalentry {
                id
            }
            triumph
        }
    }
    now returns:
      {
      "delete_lexicalentry": {
        "lexicalentry": {
          "id": [
            949,
            21
          ]
        },
        "triumph": true
      }
    }
    """

    class Arguments:
        id = LingvodocID(required=True)

    lexicalentry = graphene.Field(LexicalEntry)
    triumph = graphene.Boolean()

    @staticmethod
    @acl_check_by_id('delete', 'lexical_entries_and_entities', id_key= "parent_id")
    def mutate(root, info, **args):
        id = args.get('id')
        client_id, object_id = id
        dblexicalentry = DBSession.query(dbLexicalEntry).filter_by(client_id=client_id, object_id=object_id).first()
        if dblexicalentry and not dblexicalentry.marked_for_deletion:
            del_object(dblexicalentry)
            objecttoc = DBSession.query(dbObjectTOC).filter_by(client_id=dblexicalentry.client_id,
                                                             object_id=dblexicalentry.object_id).one()
            del_object(objecttoc)
            lexicalentry = LexicalEntry(id=[dblexicalentry.client_id, dblexicalentry.object_id])
            lexicalentry.dbObject = dblexicalentry
            return DeleteLexicalEntry(lexicalentry=lexicalentry, triumph=True)
        raise ResponseError(message="No such entity in the system")

class BulkCreateLexicalEntry(graphene.Mutation):
    class Arguments:
        lexicalentries = graphene.List(ObjectVal)

    triumph = graphene.Boolean()

    @staticmethod
    def mutate(root, info, **args):
        lexicalentries = args.get('lexicalentries')
        lexentries_list = list()
        client = DBSession.query(Client).filter_by(id=info.context["client_id"]).first()
        if not client:
            raise KeyError("Invalid client id (not registered on server). Try to logout and then login.",
                           info.context["client_id"])
        for lexentry in lexicalentries:
            id = lexentry["id"]

            perspective_id = lexentry["perspective_id"]

            dblexentry = create_lexicalentry(id, perspective_id, False)
            lexentries_list.append(dblexentry)


        DBSession.bulk_save_objects(lexentries_list)
        DBSession.flush()
        return BulkCreateLexicalEntry(triumph=True)


class ConnectLexicalEntries(graphene.Mutation):
    class Arguments:
        connections = graphene.List(LingvodocID, required = True)
        field_id = LingvodocID(required=True)
        tag = graphene.String()

    triumph = graphene.Boolean()

    @staticmethod
    @client_id_check()
    def mutate(root, info, **args):
        request = info.context.request
        variables = {'auth': authenticated_userid(request)}
        client = DBSession.query(Client).filter_by(id=variables['auth']).first()
        user = DBSession.query(dbUser).filter_by(id=client.user_id).first()
        tags = list()
        tag = args.get('id')
        if tag is not None:
            tags.append(tag)
        # if 'tag' in req:
        #     tags.append(req['tag'])
        field_id = args['field_id']
        field = DBSession.query(dbField).\
            filter_by(client_id=field_id[0], object_id=field_id[1]).first()

        if not field:
            raise ResponseError('No such field in the system')

        if field.data_type != 'Grouping Tag':
            raise ResponseError("wrong field data type")
        connections = args['connections']
        for par in connections:
            parent = DBSession.query(dbLexicalEntry).\
                filter_by(client_id=par[0], object_id=par[1]).first()
            if not parent:
                raise ResponseError("No such lexical entry in the system")
            par_tags = find_all_tags(parent, field_id[0], field_id[1], False)
            for tag in par_tags:
                if tag not in tags:
                    tags.append(tag)
        if not tags:
            n = 10  # better read from settings
            tag = time.ctime() + ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits)
                                         for c in range(n))
            tags.append(tag)
        lexical_entries = find_lexical_entries_by_tags(tags, field_id[0], field_id[1], False)
        for par in connections:
            parent = DBSession.query(dbLexicalEntry).\
                filter_by(client_id=par[0], object_id=par[1]).first()
            if parent not in lexical_entries:
                lexical_entries.append(parent)

        for lex in lexical_entries:
            for tag in tags:
                tag_entity = DBSession.query(dbEntity) \
                    .join(dbEntity.field) \
                    .join(dbEntity.publishingentity) \
                    .filter(dbEntity.parent == lex,
                            dbField.client_id == field_id[0],
                            dbField.object_id == field_id[1],
                            dbEntity.content == tag,
                            dbEntity.marked_for_deletion == False).first()
                if not tag_entity:
                    tag_entity = dbEntity(client_id=client.id,
                                        field=field, content=tag, parent=lex)
                    group = DBSession.query(dbGroup).join(dbBaseGroup).filter(
                        dbBaseGroup.subject == 'lexical_entries_and_entities',
                        dbGroup.subject_client_id == tag_entity.parent.parent.client_id,
                        dbGroup.subject_object_id == tag_entity.parent.parent.object_id,
                        dbBaseGroup.action == 'create').one()
                    if user in group.users:
                        tag_entity.publishingentity.accepted = True
        return ConnectLexicalEntries(triumph=True)
